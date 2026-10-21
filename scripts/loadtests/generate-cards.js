import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const users = Number(__ENV.USERS || 1000);
const iterations = Number(__ENV.ITERATIONS || 1);
const offset = Number(__ENV.FIXTURE_OFFSET || 0);
const preview = __ENV.FETCH_ARTIFACT !== 'false';
const fixtures = new SharedArray('fresh card workloads', () => {
  const records = JSON.parse(open(__ENV.FIXTURES || './loadtest-fixtures.json')).users;
  if (!Number.isInteger(users) || users < 1 || !Number.isInteger(iterations) || iterations < 1
      || !Number.isInteger(offset) || offset < 0 || records.length < offset + users) {
    throw new Error('Provide enough fresh fixtures for USERS, ITERATIONS and FIXTURE_OFFSET.');
  }
  const seenUsers = new Set();
  const seenEvents = new Set();
  for (let i = offset; i < offset + users; i++) {
    const user = records[i];
    if (!user.access_token || seenUsers.has(user.user_id) || user.workloads.length < iterations) {
      throw new Error('Each VU needs a distinct authenticated user and fresh events for every iteration.');
    }
    seenUsers.add(user.user_id);
    for (let j = 0; j < iterations; j++) {
      const work = user.workloads[j];
      if (seenEvents.has(work.event_id) || work.guest_ids.length !== Number(__ENV.GUESTS || 500)
          || new Set(work.guest_ids).size !== work.guest_ids.length) {
        throw new Error('Expected distinct fresh events with the configured guest count.');
      }
      seenEvents.add(work.event_id);
    }
  }
  return records;
});

const batchTime = new Trend('card_batch_ms', true);
const workflowTime = new Trend('card_workflow_ms', true);
const artifactTime = new Trend('card_artifact_ms', true);
const workflowFailed = new Rate('card_workflow_failed');
const cardsCreated = new Counter('cards_created');
const completed = new Counter('card_workflows_completed');
const totalWorkflows = users * iterations;
const guests = Number(__ENV.GUESTS || 500);
export const options = {
  scenarios: {
    fresh_generation: {
      executor: 'per-vu-iterations', vus: users, iterations,
      maxDuration: __ENV.MAX_DURATION || '10m', gracefulStop: '5s',
    },
  },
  thresholds: {
    card_batch_ms: ['p(95)<=2000'],
    card_workflow_ms: ['p(95)<=30000'],
    card_workflow_failed: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1'],
    cards_created: [`count==${totalWorkflows * guests}`],
    card_workflows_completed: [`count==${totalWorkflows}`],
    ...(preview ? { card_artifact_ms: ['p(95)<=2000'] } : {}),
    ...(__ENV.BASELINE_P95_MS ? {
      card_workflow_ms: ['p(95)<=30000', `p(95)<=${Number(__ENV.BASELINE_P95_MS)}`],
    } : {}),
  },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const user = fixtures[offset + exec.vu.idInTest - 1];
  const work = user.workloads[exec.vu.iterationInScenario];
  const headers = { 'Content-Type': 'application/json', Cookie: `apexecard_access=${user.access_token}` };
  const started = Date.now();
  const codes = new Set();
  const guestCards = new Map();
  let firstCard;
  let success = true;
  for (let start = 0; start < work.guest_ids.length; start += 100) {
    const selected = work.guest_ids.slice(start, start + 100);
    const res = http.post(`${baseUrl}/api/events/${work.event_id}/invitations/generate`,
      JSON.stringify({ guest_ids: selected, template_id: work.template_id }),
      { headers, timeout: '35s', tags: { name: 'generate_card_batch' } });
    batchTime.add(res.timings.duration);
    let body;
    try { body = res.json(); } catch { body = {}; }
    const cards = body.invitations || [];
    const valid = check(res, {
      'fresh batch creates every selected card': () => res.status === 201 && body.created_count === selected.length
        && body.existing_count === 0 && cards.length === selected.length,
      'cards have unique IDs, QR data and correct guests': () => cards.length === selected.length
        && cards.every((card) => {
          const validCard = /^CARD-[0-9A-F]{32}$/.test(card.invitation_code)
            && card.qr_data === card.invitation_code && card.has_card_artifact
            && selected.includes(card.guest_id) && !codes.has(card.invitation_code)
            && !guestCards.has(card.guest_id) && card.event === work.event_id;
          codes.add(card.invitation_code);
          guestCards.set(card.guest_id, card.invitation_code);
          return validCard;
        }),
    });
    if (!valid) { success = false; break; }
    cardsCreated.add(body.created_count);
    firstCard = firstCard || cards[0];
  }
  if (success && preview) {
    const res = http.get(`${baseUrl}/api/events/${work.event_id}/invitations/${firstCard.id}`,
      { headers, timeout: '35s', tags: { name: 'card_artifact_detail' } });
    artifactTime.add(res.timings.duration);
    let body;
    try { body = res.json(); } catch { body = {}; }
    success = check(res, {
      'finished artifact contains saved design, guest and matching QR': () => res.status === 200
        && body.invitation_code === firstCard.invitation_code && body.qr_data === firstCard.invitation_code
        && body.card_snapshot?.guest?.id === firstCard.guest_id
        && body.card_snapshot?.guest?.full_name === firstCard.guest_name
        && Number(body.card_snapshot?.template?.id) === work.template_id
        && typeof body.card_svg === 'string' && body.card_svg.includes('<svg')
        && body.card_svg.includes(firstCard.invitation_code) && body.qr_svg?.includes('<svg')
        && body.card_svg.includes(firstCard.guest_name)
        && (!body.card_snapshot?.template?.image_data_url
          || body.card_svg.includes(body.card_snapshot.template.image_data_url)),
    });
  }
  // Failed attempts are timed too; the count/rate gates prevent a fast partial
  // batch or an idempotent no-op from being reported as successful generation.
  workflowTime.add(Date.now() - started);
  workflowFailed.add(!success || codes.size !== work.guest_ids.length);
  if (success && codes.size === work.guest_ids.length) completed.add(1);
}

export function handleSummary(data) {
  const path = __ENV.SUMMARY_PATH || 'loadtest-results/summary.json';
  return { [path]: JSON.stringify(data, null, 2), stdout: JSON.stringify({
    users, iterations, guests, artifact: preview,
    workflow: data.metrics.card_workflow_ms?.values,
    batch: data.metrics.card_batch_ms?.values,
    completed: data.metrics.card_workflows_completed?.values.count || 0,
    cards: data.metrics.cards_created?.values.count || 0,
    failed: data.metrics.card_workflow_failed?.values.rate,
  }, null, 2) + '\n' };
}
