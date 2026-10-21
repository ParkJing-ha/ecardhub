# Production readiness review — 10 October 2026

**Verdict: not ready for public production launch.** The frontend compiles, but there are security, integration, and incomplete-feature blockers. The findings below record the original inspection of the working tree, including existing uncommitted changes.

**NFR-04 follow-up, 10 October 2026:** generation now uses bulk inserts (100-card sample: 111 → 12 SQL queries) and compact queries fetch each shared design snapshot once. A separate production runtime with Next.js standalone, Gunicorn, bounded PostgreSQL pools, Nginx and readiness checks is available in `docker-compose.production.yml`; it has not been deployed publicly and still requires real HTTPS ingress configuration. The accepted target is 500 cards within 30 seconds. A fresh local 100-user baseline completed all 50,000 cards at workflow p95 28.96 seconds, but exceeded the batch/preview latency gates. The subsequent fresh 1,000-user burst completed zero 500-card workflows: 72.67% HTTP failures, 100% workflow failures, and partial cards remaining after timeouts. **NFR-04 failed on the tested shared four-CPU configuration and is not production-certified.** See [the recorded results](docs/NFR-04-local-burst-results.json) and [validation notes](docs/NFR-04.md) for workload, hardware and limits. New regression tests cover simultaneous generation and preserved RSVP dates. Production settings reject weak secrets when `DJANGO_PRODUCTION=true`; the original development environment has not had its secret rotated.

**Dependency follow-up:** the registry audit completed and identified advisories in Next.js 16.3.1, sharp and source-map-js. Compatible patches updated Next.js to 16.3.8, sharp to 0.35.5 and source-map-js to 1.2.2. `npm audit --omit=dev` now reports zero known runtime advisories. Five high-severity findings remain in the development ESLint/fast-glob/micromatch/braces dependency chain; npm's suggested forced fix downgrades the Next ESLint configuration and was not applied. This is dependency-audit evidence, not proof that the entire application is secure. See the [Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) and [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).

**Follow-up fixes, 10 October 2026:** invitation/contribution/check-in list serialization is fixed. Event creation and My Events → Cards open `/events/{id}`; bulk card generation returns to that dashboard. Card IDs now use server-generated cryptographic randomness, QR images are generated locally, and saved event/design/guest snapshots produce downloadable SVG cards. Generation is limited to 100 guests per request, the frontend processes longer selections in batches, retries preserve completed cards, and full artifacts load on demand. Event creation retries reuse an event whose design failed to save. The frontend lint and production build passed; 11 backend tests passed. A browser check with mocked data covered 125 guests, partial failure/retry, selected-card loading/download, and mobile layout. A QR decoded from a finished card returned its exact card ID. The original list-crash, card-routing and external-QR findings below are therefore resolved; wallet, production infrastructure, authentication hardening and actual delivery-provider integration still require work.

## Checks performed

| Check | Result |
| --- | --- |
| Frontend `npm run lint` | Passed |
| Frontend `npm run build` | Passed, including TypeScript and route generation |
| Docker backend `python manage.py test --noinput` | Passed: only one test, covering guest isolation between two events of the same owner |
| Backend `makemigrations --check --dry-run` | Passed: no model/migration drift |
| Backend `showmigrations --plan` | All listed migrations applied |
| Backend `python -m pip check` | Passed: dependency compatibility only, not a vulnerability scan |
| Backend `check --deploy` | Three security warnings: weak secret key, no SSL redirect, no HSTS |
| Unauthenticated frontend `/api/events` and backend `/api/events/` | Both returned 401 |
| Frontend `npm audit --json` | Unable to complete: registry request failed both in sandbox and with network approval |

The running backend reports Django 6.1. Local Python environments were unsuitable for backend validation, so the backend checks above ran in Docker. No dependency-CVE clearance, browser end-to-end clearance, payment-provider validation, or production infrastructure clearance is implied by these results.

## Launch blockers

### 1. High: clients can create completed wallet credits and attach other users' events

Locations: `backend/events_app/serializers.py:312`, `backend/events_app/views.py:292`, `frontend/app/api/wallet/transactions/route.ts:25`, `frontend/components/dashboard/views/WalletView.tsx:35`.

Wallet fields `event`, `direction`, `amount`, `provider`, `gateway_reference`, and `status` are writable. The Next.js route forwards the submitted JSON unchanged. The backend sets the transaction owner but does not constrain the event to that owner's events. A user can submit a `credit` with `status: completed` without payment confirmation; the UI includes it in the available balance. This is confirmed ledger/display manipulation; no withdrawal or real-money exploit was tested.

Fix: accept only a validated positive top-up amount and supported provider; assign credit direction and pending status on the server. Validate event ownership. Only authenticated, signature-verified, idempotent payment callbacks should complete transactions. Implement server-side balance accounting before using balances for purchases. Payment integration is currently unfinished.

### 2. High: weak Django signing secret in the running configuration

Location: `backend/config/settings.py:33`.

`check --deploy` raised `security.W009` for the running environment. Settings also allow the public fallback `django-insecure-dev-only-change-me` when the environment variable is missing. SimpleJWT uses Django's secret by default, so a known or guessable signing secret threatens authentication. The check establishes that the configured key fails Django's strength checks; it does not establish that the running value equals the fallback.

Fix: require a strong, randomly generated secret for production and fail startup if it is missing or insecure. Rotate the deployed secret and invalidate affected sessions as appropriate. Keep secrets out of source control and build artifacts.

### 3. High: deployment runs development servers

Locations: `docker-compose.yml`, `frontend/Dockerfile`, `backend/Dockerfile`.

Both Dockerfiles and Compose start development servers: `next dev` and Django `runserver`. Compose also bind-mounts application source and exposes backend port 8000 on all interfaces. There is no production frontend build stage, production Python server, or production HTTPS proxy configuration in the reviewed repository.

Fix: add production images with `next build`/`next start` or standalone output and a production WSGI/ASGI server. Remove development mounts, run with reduced privileges, place services behind an HTTPS reverse proxy, and restrict backend access. Configure static serving with `STATIC_ROOT`/`collectstatic` or an equivalent service; Django admin static assets currently have no production serving setup.

The running Django configuration also raised `security.W008` and `security.W004`. Enforce HTTPS at the edge, configure trusted forwarded-protocol handling for the chosen hosting setup, then enable suitable HSTS. Do not blindly enable Django redirects on internal HTTP connections without configuring the proxy correctly.

### 4. High: three list endpoints crash because of serializer handling

Locations: `backend/events_app/views.py:144`, `:219`, `:247`.

Invitation, contribution, and check-in views customize `serializer.fields` in `get_serializer()`. DRF calls this with `many=True` for lists, which returns a `ListSerializer` without `.fields`. The installed serializer was inspected in Docker and confirmed to lack that attribute. Consequently, these list paths fail. Invitation creation also uses `self.get_serializer(created, many=True)` after saving, so it can commit records before failing to serialize the response.

Fix: constrain the child serializer's related querysets when `many=True`, or move related-field scoping into serializer initialization/context. Add endpoint tests for empty and populated lists, successful creation responses, ownership boundaries, and retry behavior. Wrap multi-record invitation creation in an appropriate transaction and enforce uniqueness in the database.

### 5. High: invitation dispatch reports success without sending anything

Location: `backend/events_app/views.py:173`.

The dispatch endpoint sets invitations and notification logs to `sent`, but does not call an email/SMS/WhatsApp provider or enqueue delivery work. It also accepts an arbitrary channel without serializer validation. The product can tell hosts invitations were sent when no delivery occurred.

Fix: implement provider integration and validated channels, with queued/sent/delivered/failed states based on actual results, retry handling, and idempotency. Until implemented, disable sending or explicitly present it as unavailable.

### 6. Medium: password recovery is a placeholder

Locations: `frontend/app/reset-password/page.tsx:61`, `backend/config/urls.py`.

The page says the password is ready to reset; it performs no request. There is no recovery-token issuance, email delivery, or password-reset endpoint in the backend routes.

Fix: implement an expiring, single-use recovery-token flow with rate limits and non-enumerating responses, or remove the recovery promise from the launch interface.

## Next.js routing and backend communication

The project follows App Router structure: `app/page.tsx`, `layout.tsx`, API `route.ts` files, awaited Promise-based route params, `next/navigation`, and a root `proxy.ts`. The installed Next.js documentation confirms the proxy convention, and production route generation succeeded. Replacing this structure with Pages Router is unnecessary.

The browser generally calls same-origin Next.js APIs; server-side code forwards to Django using the private `DJANGO_API_URL`. JWT cookies are HTTP-only and become Secure in production; backend requests use `cache: no-store`. Main event/guest querysets are scoped to the owner, and unauthenticated event requests were rejected. These are useful foundations, but the following need attention:

1. **Broken server-rendered templates page:** `frontend/app/templates/page.tsx` calls `getTemplates()` and `getEvents()` from `frontend/lib/data.ts`. Those helpers issue a new HTTP request to the app without forwarding the incoming cookies. Authenticated APIs therefore see an anonymous caller and return 401; errors are thrown with no page recovery. The fallback base URL also assumes localhost port 3000. Fetch Django directly from the server using the incoming access token and render a deliberate signed-out/error state. Avoid calling a cookie-mutating refresh helper during Server Component rendering.
2. **Wrong post-save destination:** `frontend/app/card-builder/[eventId]/page.tsx:140` navigates to `/?view=send&event=...`. `/` renders the landing page. The destination should be `/dashboard?view=send&event=...`.
3. **Refresh concurrency:** `frontend/lib/authenticated-django-api.ts` refreshes independently after each 401, while Django rotates and blacklists refresh tokens. Event detail loads several endpoints in parallel; expired access tokens can cause multiple requests to race with the same refresh token, producing mixed successes and failures. Coordinate refresh and retry, and verify this with simultaneous requests at token expiry. Test dashboard refresh, direct event/card-builder navigation, invalid tokens, and backend outages.
4. **Backend fetch robustness:** `frontend/lib/django-api.ts` has no explicit timeout. Broad route catches turn malformed client JSON and backend failures into generic 503 responses, which hides the reason and makes monitoring harder. Add bounded timeouts, input validation with 400 responses, and structured server logging that excludes passwords and tokens.
5. **Page access/error handling:** only the dashboard has a server-side user gate. Event/card-builder pages depend on API rejection and can show misleading missing-event states or unhandled promise errors. Add deliberate authentication, error and loading behavior, and appropriate `error.tsx`/`not-found.tsx` boundaries.

## Further security and operational gaps

- **Authentication abuse:** no DRF throttles or login/register/refresh-specific limits are configured. No edge rate-limiting configuration was found. Add authentication rate limits, signup abuse protection and monitoring. Password validation and Argon2 hashing are already configured.
- **Cookie-authenticated API origin protection:** Next.js mutation handlers do not validate Origin or use CSRF tokens. SameSite=Lax helps, but does not cover every same-site/subdomain threat. Explicitly protect cookie-authenticated writes; Django JWT authentication does not supply protection for the browser-to-Next.js cookie boundary. This is a hardening gap, not a demonstrated cross-site exploit.
- **Audit integrity:** audit entries are submitted by the client and can be fabricated or omitted. Generate authoritative logs server-side as part of successful operations; keep client activity logs separate.
- **Unbounded work:** API lists have no pagination and bulk guest/invitation requests have no explicit application-level batch limits. Add bounded batches, pagination, quotas and request-size enforcement; check template image limits against frontend/proxy limits. Validate dispatch input shape so malformed data returns 400 instead of an exception.
- **QR privacy and trust:** `frontend/components/templates/QRImage.tsx` sends QR contents to `api.qrserver.com`; `frontend/lib/templates.ts:199` generates codes with `Math.random`. Generate QR images locally. Generate any admission credential on the server with cryptographic randomness and validate it server-side; do not treat browser-generated codes as security credentials.
- **Security headers:** no custom CSP or clickjacking policy is configured in Next.js. Add a policy compatible with the app's scripts, styles, fonts and images; configure appropriate production headers at the edge or app.
- **Backups/artifacts:** tracked legacy `frontend/lib/*.backup` and `*.old` files reference the former local auth store. The Docker ignore file does not exclude `.data`, so local authentication data may enter the build context/image. Exclude private/local data and obsolete files from production artifacts, and inspect deployed images for accidental data inclusion. Secret values were not printed during this review.
- **Operations:** no CI release gates, backup/restore procedure, application health/readiness checks, error monitoring, or rollback procedure were found in the reviewed repository. The database healthcheck exists, but backend/frontend checks do not. Add these before launch; prove a database restore in staging.
- **Test coverage:** the only test covers two events of one owner. Add independent-user isolation, wallet forgery rejection, authentication/refresh/logout, list/create operations, and meaningful browser flows. The passing build does not exercise providers or database-backed page behavior.

## Release gate

Resolve the launch blockers, run dependency vulnerability scans successfully for both ecosystems, and exercise the real production images behind HTTPS in staging. Verify registration/login, expired-token parallel calls, event/guest CRUD, templates, invitation delivery, check-in, and provider-confirmed payments. Require backend deployment checks to pass with the intended production settings, and verify backups, monitoring and rollback before accepting public users.

References: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist), [Next.js proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Django deployment checklist](https://docs.djangoproject.com/en/dev/howto/deployment/checklist/).
