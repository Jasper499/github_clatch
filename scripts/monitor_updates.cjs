// Shared with the website; keep the schedules aligned with workflow cron.
const { schedules, expectedDue, evaluate } = require('../js/update-schedule.js');
const RETRY_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const ISSUE_TITLE = 'Content update monitor: overdue sources';

function selectRecovery(overdue, runs, now) {
  const names = new Set(schedules.map(row => row.name));
  if (runs.some(run => names.has(run.name) && run.status !== 'completed')) return null;
  return [...overdue].sort((a, b) => a.due - b.due).find(row => !runs.some(run =>
    run.name === row.name && run.event === 'workflow_dispatch' && Date.parse(run.created_at) > now.getTime() - RETRY_COOLDOWN_MS
  )) || null;
}

async function run({ github, context, core }) {
  const repo = context.repo;
  const now = new Date();
  const records = {};
  await Promise.all(schedules.flatMap(row => row.sources).map(async key => {
    try {
      const response = await github.rest.repos.getContent({ ...repo, path: `data/sources/${key}.lite.json`, ref: 'main' });
      const file = response.data;
      if (file.type !== 'file' || file.encoding !== 'base64') throw new Error(`Unexpected snapshot response: ${key}`);
      records[key] = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    } catch (error) {
      if (error.status !== 404) throw error;
      records[key] = null;
    }
  }));
  const overdue = evaluate(records, now);
  const graceInput = context.payload?.inputs?.recovery_grace_minutes || '90';
  if (!['0', '90'].includes(graceInput)) throw new Error('Invalid recovery grace period.');
  const recoverable = evaluate(records, now, Number(graceInput));
  const issues = await github.paginate(github.rest.issues.listForRepo, { ...repo, state: 'open', per_page: 100 });
  const existing = issues.find(issue => issue.title === ISSUE_TITLE && issue.user?.login === 'github-actions[bot]' && !issue.pull_request);
  if (!overdue.length) {
    if (existing) await github.rest.issues.update({ ...repo, issue_number: existing.number, state: 'closed' });
    core.info('All source snapshots are within their scheduled update window.');
  } else {
    const body = [
      'Scheduled content updates are overdue (90-minute grace period).',
      '',
      '| Source | Latest saved time (UTC) | Expected update slot (UTC) |',
      '| --- | --- | --- |',
      ...overdue.flatMap(row => row.overdue.map(key => `| ${key} | ${records[key]?.savedAt || 'missing'} | ${row.due.toISOString()} |`)),
      '',
      'The monitor attempts one recovery workflow at a time, waits for active data updates, and limits manual recovery attempts to once per workflow every two hours.',
      'This issue closes automatically when all sources recover. Unchanged alerts do not create repeated comments.',
      '',
      `[Monitor runs](https://github.com/${repo.owner}/${repo.repo}/actions/workflows/monitor-updates.yml)`,
    ].join('\n');
    if (existing) {
      if (existing.body !== body) await github.rest.issues.update({ ...repo, issue_number: existing.number, body });
    } else {
      await github.rest.issues.create({ ...repo, title: ISSUE_TITLE, body });
    }
  }
  if (!recoverable.length) return;
  const recent = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
    ...repo, branch: 'main', created: `>=${new Date(now.getTime() - RETRY_COOLDOWN_MS).toISOString()}`, per_page: 100,
  });
  const activeLists = await Promise.all(['queued', 'in_progress', 'waiting', 'pending', 'requested'].map(status =>
    github.paginate(github.rest.actions.listWorkflowRunsForRepo, { ...repo, branch: 'main', status, per_page: 100 })
  ));
  const recovery = selectRecovery(recoverable, [...recent, ...activeLists.flat()], now);
  if (!recovery) {
    core.info('Recovery deferred: a data workflow is active or the two-hour cooldown applies.');
    return;
  }
  await github.rest.actions.createWorkflowDispatch({ ...repo, workflow_id: recovery.file, ref: 'main' });
  core.info(`Dispatched recovery for ${recovery.name}.`);
}

module.exports = { schedules, expectedDue, evaluate, selectRecovery, run };
