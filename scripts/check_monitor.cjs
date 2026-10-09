// Run: node scripts/check_monitor.cjs (no dependencies).
const assert = require('node:assert/strict');
const { schedules, expectedDue, evaluate, selectRecovery, run } = require('./monitor_updates.cjs');
const now = new Date('2026-10-09T03:31:00Z'); // Beijing 11:31.
const find = file => schedules.find(row => row.file === file);
assert.equal(expectedDue(find('twice-daily-hackernews.yml'), now).toISOString(), '2026-10-09T02:00:00.000Z');
assert.equal(expectedDue(find('twice-daily-hackernews.yml'), new Date('2026-10-09T03:29:00Z')).toISOString(), '2026-10-08T14:00:00.000Z');
assert.equal(expectedDue(find('weekly-update.yml'), now).toISOString(), '2026-10-05T01:00:00.000Z');
assert.equal(expectedDue(find('biweekly-journals.yml'), new Date('2026-03-01T03:00:00Z')).toISOString(), '2026-02-15T02:00:00.000Z');
const healthy = {};
for (const row of schedules) for (const source of row.sources) healthy[source] = { savedAt: now.toISOString(), items: [] };
assert.equal(evaluate(healthy, now).length, 0);
const stale = { ...healthy, hackernews: { savedAt: '2026-10-08T15:00:00Z', items: [] }, weiboLocal: null };
const overdue = evaluate(stale, now);
assert.equal(overdue.length, 2);
assert.deepEqual(overdue.find(row => row.file === 'twice-daily-weibo.yml').overdue, ['weiboLocal']);
assert.equal(evaluate({ ...healthy, github: { savedAt: 'invalid', items: [] } }, now).length, 1);
assert.equal(evaluate({ ...healthy, github: { savedAt: '2027-01-01T00:00:00Z', items: [] } }, now).length, 1);
const recovery = selectRecovery(overdue, [], now);
assert.equal(recovery.file, 'twice-daily-weibo.yml');
assert.equal(selectRecovery(overdue, [{ name: 'Weekly Content Update', status: 'queued' }], now), null);
const recent = { name: recovery.name, event: 'workflow_dispatch', status: 'completed', created_at: now.toISOString() };
assert.equal(selectRecovery(overdue, [recent], now).file, 'twice-daily-hackernews.yml');

// Exercise the actual API orchestration: no repeated alerts, no overlapping dispatch, close on recovery.
(async () => {
  const liveNow = new Date();
  const records = {};
  for (const row of schedules) for (const source of row.sources) records[source] = { savedAt: liveNow.toISOString(), items: [] };
  records.hackernews.savedAt = '2020-01-01T00:00:00Z';
  let issue = null, dispatches = 0, updates = 0;
  const github = {
    rest: {
      repos: { getContent: async ({path}) => ({ data: { type: 'file', encoding: 'base64', content: Buffer.from(JSON.stringify(records[path.split('/').at(-1).replace('.lite.json','')])).toString('base64') } }) },
      issues: {
        listForRepo: () => {},
        create: async ({title,body}) => { issue = {title,body,number:1,user:{login:'github-actions[bot]'}}; },
        update: async ({body,state}) => { updates++; if (body) issue.body=body; if (state==='closed') issue=null; },
      },
      actions: { listWorkflowRunsForRepo: () => {}, createWorkflowDispatch: async () => { dispatches++; } },
    },
    paginate: async method => method === github.rest.issues.listForRepo ? (issue ? [issue] : []) : [{ name: 'Twice-Daily Hacker News Update', event: 'workflow_dispatch', status: 'completed', created_at: liveNow.toISOString() }],
  };
  const args = {github,context:{repo:{owner:'owner',repo:'repo'}},core:{info(){}}};
  await run(args); assert(issue); assert.equal(dispatches,0);
  await run(args); assert.equal(updates,0, 'Unchanged alerts must not write or comment repeatedly');
  records.hackernews.savedAt=liveNow.toISOString();
  await run(args); assert.equal(issue,null); assert.equal(updates,1);
  github.paginate = async method => method === github.rest.issues.listForRepo ? [] : [];
  args.context.payload = {inputs:{recovery_grace_minutes:'0'}};
  const currentDue = expectedDue(find('twice-daily-hackernews.yml'), liveNow, 0);
  records.hackernews.savedAt=new Date(currentDue.getTime()-60000).toISOString();
  await run(args); assert.equal(dispatches,1, 'External checks dispatch without waiting for alert grace');

  const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
  let externalDispatch = 0;
  const worker = {
    monitor: require('./monitor_updates.cjs'), Date, AbortSignal, Response, console:{log(){}},
    fetch: async (url,options) => {
      if (url.includes('api.github.com')) {
        externalDispatch++;
        assert.equal(options.headers.Authorization,'Bearer test-token');
        assert.equal(JSON.parse(options.body).inputs.recovery_grace_minutes,'0');
        return new Response(null,{status:204});
      }
      const key = new URL(url).pathname.split('/').at(-1).replace('.lite.json','');
      return Response.json(records[key]);
    },
  };
  vm.createContext(worker);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../workers/update-scheduler.js'),'utf8').replace("import monitor from '../scripts/monitor_updates.cjs';",'').replace('export default {','globalThis.scheduler = {'), worker);
  await worker.scheduler.scheduled({scheduledTime:liveNow.getTime()},{GITHUB_TOKEN:'test-token'});
  assert.equal(externalDispatch,1);
  await assert.rejects(worker.scheduler.scheduled({scheduledTime:liveNow.getTime()},{}), /secret is missing/);
  records.hackernews.savedAt=liveNow.toISOString();
  await worker.scheduler.scheduled({scheduledTime:liveNow.getTime()},{});
  assert.equal(externalDispatch,1,'Healthy snapshots must not trigger unnecessary workflows');
  console.log('PASS: scheduled deadlines, grace, partial-source failures, future timestamps, recovery cooldown, active-job guard and alert lifecycle.');
})().catch(error => {console.error(error);process.exitCode=1;});
