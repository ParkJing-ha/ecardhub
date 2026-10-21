# NFR-04: concurrent card generation

**Status: the measured local 1,000-user burst failed acceptance. Production capacity
is not verified; NFR-04 must not be marked passed.**

On 10 October 2026, an isolated production-mode stack on the shared four-CPU,
7.64-GiB development workstation ran a fresh 100-user baseline followed by a fresh
1,000-user burst. Both used the same 54,132-byte saved uploaded design, four backend
replicas and two frontend replicas. Fixtures for both runs were prepared before
timing; five separate fresh warm-up workflows preceded the baseline. Requests went
through Nginx → Next.js 16.3.8 standalone → Gunicorn → PostgreSQL 18.

| Measurement | 100-user baseline | 1,000-user burst |
| --- | ---: | ---: |
| Finished 500-card workflows | 100 / 100 | 0 / 1,000 |
| New cards acknowledged by the client | 50,000 / 50,000 | 37,600 / 500,000 |
| Cards eventually persisted in PostgreSQL | 50,000 | 137,600, all partial events |
| Workflow attempt p95 | 28.96 s | 59.73 s |
| 100-card request p95 | 7.59 s | 35.00 s |
| Full-artifact request p95 | 5.12 s | No requests reached this step |
| Unexpected HTTP error rate | 0% | 72.67% |
| Workflow failure rate | 0% | 100% |
| Persisted acceptance verification | Passed | Failed |

**59.73 seconds is the duration of failed attempts, not successful card completion.**
All 1,000 full-run events ended with 100 or 200 cards. Client timeouts did not cancel
the backend's already accepted transactions: PostgreSQL contained 100,000 more
cards than successful client responses acknowledged. The stored 137,600 cards had
distinct Card IDs and event/guest pairs, matching QR data and non-null generation
snapshots. That partial correctness does not satisfy the completion requirement.
Retries must keep existing IDs and resume missing cards.

Proxy logs recorded 376 HTTP 201 responses, 793 client disconnects (499) and 207
service-unavailable responses (503) in the full burst. Reconstructed request
intervals show approximately 1,000 event workflows overlapping at the edge;
this is not 1,000 simultaneous backend executions. The pool remained bounded at
32 application connections (33 including the sampling query). Samples captured
31 PostgreSQL LWLock waits and no heavyweight lock waits, without recording the
individual LWLock event names. The host load average reached 20.04, swap usage
grew by about 846 MiB, and sampled stack CPU reached 3.22 cores. No container
restarts, OOM exits or resource-guard abort occurred. The generator peaked at
746 MiB RSS with no swap and did not show CPU saturation; server and generator
still shared hardware, so this is evidence about this configuration, not a clean
production sizing measurement.

[Recorded burst metrics](NFR-04-local-burst-results.json) include timings,
threshold outcomes, build image digests, persisted counts and resource samples.
The private fixtures and synthetic test stack were removed after verification.
The separate development database was not used for fixture writes.

The next capacity run needs dedicated application/database resources and a
separate generator. Profile exact PostgreSQL wait events and storage latency,
then tune connection/worker counts together; adding replicas on the same saturated
host is not evidence of capacity. Candidate code improvements include forwarding
already encoded backend JSON through Next.js without parsing/re-encoding it,
reducing repeated snapshot metadata in generation responses, and avoiding repeated
large-image reads when reusing immutable design snapshots. These candidates have
not been implemented or benchmarked. A persistent job queue can bound overload,
but accepting a job quickly does not satisfy the 30-second completion target.

This was a single burst using small artwork and one full artifact per successful
workflow. Large artwork, all-card export, sustained/soak behavior, HTTPS browser
login, and a production deployment remain outside this measurement.

Local validation on 10 October 2026: 25 backend tests, frontend lint and production
builds passed. A five-user smoke run through Nginx → Next.js 16.3.8 standalone →
Gunicorn/pooled PostgreSQL, with two replicas of each application service, created
2,500 fresh cards with a 1,441,303-byte uploaded PNG and loaded five complete
artifacts. Workflow p95 was 2.67 seconds, batch p95 0.47 seconds, and there were no
failures. PostgreSQL result verification passed. Reusing completed fixtures failed
the benchmark as expected. [Recorded smoke metrics](NFR-04-smoke-results.json)
are **not** 1,000-user acceptance evidence. The generator and servers shared a
four-CPU development workstation. The larger local run above has since failed;
dedicated production and sustained/soak runs remain pending.

The supplied 500-guest Excel import and five-batch browser flow also passed after
the Next.js security upgrade, using mocked APIs without changing real guest data.

A separate isolated database sample reduced the 100-card generation request from
111 SQL queries before optimization to 12 afterward. Single local timings under
changing build load are diagnostic, not a statistical throughput comparison.

The user's accepted target is **500 cards within 30 seconds**. The benchmark applies
this to p95 of complete workflows, with p95 ≤ 2 seconds per 100-card request and
unexpected HTTP/workflow errors < 1%. Every workload must finish and create all
requested cards. Unique Card IDs, matching QR data, event ownership, immutable
design/guest snapshots and retry correctness are required independently of latency.

The acceptance run uses 1,000 distinct authenticated users, each generating 500
fresh cards in five sequential requests of 100: **500,000 new cards / 5,000 POSTs**.
One full SVG/QR preview per user is included by default, with p95 ≤ 2 seconds.
The current system stores immutable card data and generates SVG/QR artifacts when
opened; this benchmark does not claim that 500,000 PNG/PDF files are rendered or
that messages are delivered. Measure a separate download/export workload if that
is part of release scope.

“Without degradation” must also be checked against a 100-user baseline on the same
hardware/build/design mix. Set `BASELINE_P95_MS` to the measured baseline; the
1,000-user run then fails if workflow p95 exceeds it. Any tolerance for measurement
noise needs explicit agreement, not an invented pass result.

## Changes supporting the requirement

- One bulk INSERT per 100 cards replaces per-card writes. RSVP dates are updated
  together, preserving existing dates. Event row locks and database uniqueness
  constraints keep retries/concurrent requests consistent.
- Compact lists/retries fetch each shared design snapshot once. They no longer join
  the uploaded image onto every invitation row before removing it from the response.
- An independent production Compose stack uses Next.js standalone, Gunicorn gthread,
  bounded psycopg pools, readiness checks and an Nginx proxy. Existing development
  containers remain on their current configuration.
- Next.js backend requests time out after 30 seconds rather than retaining failed
  upstream requests indefinitely. Retrying generation keeps existing Card IDs.

The worker/pool defaults are a starting configuration, **not a 1,000-user sizing
guarantee**. Each backend process owns its own pool. With four replicas, two workers
and a pool maximum of four, the backend budget is `4 × 2 × 4 = 32` DB connections,
plus administrative/migration connections. Raising threads, workers and replicas
requires checking memory, CPU and PostgreSQL's connection budget together.

## Prepare an isolated staging stack

Copy [the environment example](../deploy/production.env.example) to a private `.env`
file. Supply secrets and actual hosts; use a database name such as
`apexecard_loadtest_staging` and set `APEXECARD_LOAD_TEST_FIXTURES=true` **only for this
isolated stack**. The fixture command checks the actual connected PostgreSQL
database name and refuses ordinary project/production databases.

Use a separate Compose project and port so development data is untouched:

```bash
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml build
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml up -d db
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml run --rm backend python manage.py migrate --noinput
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml up -d --scale backend=4 --scale frontend=2
```

The provided edge listener uses HTTP for a private staging network. Public release
needs a trusted HTTPS ingress/TLS configuration. Nginx replaces forwarded headers;
do not trust arbitrary incoming `X-Forwarded-Proto` or enable SSL redirects behind
an HTTP-only proxy. Secure authentication cookies require HTTPS for browser login.
The k6 workload passes a synthetic access cookie directly, so it must not be used
as evidence that public browser login/TLS is configured.
The listener binds to `127.0.0.1` by default; set `HTTP_BIND` to a private staging
interface only when the separate load generator needs access.

## Run the benchmark

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) on a separate load
generator. Create each fixture file once and run it once. Tokens are short-lived,
written with mode 0600 and excluded from Git; never upload them with results.
Synthetic users have unusable passwords and use the reserved `.invalid` domain.

First create a **fresh baseline** (100 users, 500 guests). Add `--image-path` for a
representative saved uploaded design; use the same image in the 1,000-user test.
Copy that image into backend replica 1 first with `docker compose ... cp --index 1
/private/design.png backend:/tmp/design.png`, then pass `--image-path /tmp/design.png`
to both fixture commands. The path is inside the container.

```bash
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml exec --index 1 -T backend python manage.py prepare_card_load_test --users 100 --guests 500 --output /tmp/baseline-fixtures.json
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml cp --index 1 backend:/tmp/baseline-fixtures.json /tmp/baseline-fixtures.json
chmod 600 /tmp/baseline-fixtures.json
mkdir -p loadtest-results
BASE_URL=https://staging.example.com FIXTURES=/tmp/baseline-fixtures.json USERS=100 SUMMARY_PATH=loadtest-results/baseline.json k6 run scripts/loadtests/generate-cards.js
```

Prepare **new** 1,000-user fixtures, then use the baseline p95 value from
`metrics.card_workflow_ms.values["p(95)"]`:

```bash
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml exec --index 1 -T backend python manage.py prepare_card_load_test --users 1000 --guests 500 --output /tmp/concurrent-fixtures.json
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml cp --index 1 backend:/tmp/concurrent-fixtures.json /tmp/concurrent-fixtures.json
chmod 600 /tmp/concurrent-fixtures.json
BASE_URL=https://staging.example.com FIXTURES=/tmp/concurrent-fixtures.json USERS=1000 BASELINE_P95_MS=MEASURED_VALUE SUMMARY_PATH=loadtest-results/concurrent.json k6 run scripts/loadtests/generate-cards.js
docker compose -p apexecard-loadtest --env-file /tmp/apexecard-loadtest.env -f docker-compose.production.yml exec --index 1 -T backend python manage.py verify_card_load_test --fixtures /tmp/concurrent-fixtures.json --users 1000
```

The script uses `per-vu-iterations` and SharedArray: every VU has a different user
and event. All VUs start in the same scenario. The exact arrival overlap must be
observed in server metrics; scheduling 1,000 VUs is not itself proof of 1,000
simultaneous backend executions. Reusing completed events fails the fresh-create
checks instead of silently benchmarking idempotent no-ops.

For a local smoke run use `--users 5` and `USERS=5`; it checks tooling and correctness,
not NFR capacity. `GUESTS` must match fixtures if reduced. `FETCH_ARTIFACT=false`
isolates DB generation but excludes full artifact acceptance. Multi-iteration runs
require `--iterations N` and `ITERATIONS=N`, with a new event per user/iteration;
size fixture storage for `users × iterations × 500` cards and uploaded snapshots.
Run sustained and soak workloads separately with enough fresh fixtures; a one-burst
pass does not prove 10-minute/30-minute capacity or resource stability.

## Evidence required before marking NFR-04 passed

Record Git/build revision, test parameters, design sizes, warm-up procedure, server
and load-generator hardware, replica/worker counts, DB limits, test start/end times
and summary JSON. Report baseline versus concurrent p95/p99, completed workflows,
new cards, errors, CPU/RSS, network throughput, DB connections, waits and locks.
Run PostgreSQL result verification and a same-event retry/contention check as well.
The regression suite already exercises simultaneous same-event generation, but
that two-request correctness test is not a 1,000-user capacity test.

Pass requires all thresholds and result checks, no dropped/unfinished workflows,
no resource saturation hidden by the load generator, and stable sustained/soak
results. Increase replicas/resources or introduce bounded persistent job workers
if measured capacity falls short. Fast queue acceptance alone would not meet the
30-second card-completion target.

Runtime references: [Django PostgreSQL pools](https://docs.djangoproject.com/en/6.0/ref/databases/#connection-pool),
[psycopg pool limits](https://www.psycopg.org/psycopg3/docs/api/pool.html),
[Gunicorn settings](https://gunicorn.org/reference/settings/),
[Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting),
[k6 per-VU iterations](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/per-vu-iterations/).
