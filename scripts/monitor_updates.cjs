// UTC schedules mirror the data workflows; Beijing time is UTC+8.
const schedules = [
  { file: 'weekly-update.yml', name: 'Weekly Content Update', sources: ['github', 'githubActive'], hours: [1], minute: 0, weekdays: [1] },
  { file: 'twice-daily-hackernews.yml', name: 'Twice-Daily Hacker News Update', sources: ['hackernews'], hours: [2, 14], minute: 0 },
  { file: 'twice-daily-weibo.yml', name: 'Every 6 Hours Weibo Update', sources: ['weibo', 'weiboRealtime', 'weiboLocal'], hours: [0, 6, 12, 18], minute: 10 },
  { file: 'daily-china-daily.yml', name: 'Daily China Daily Update', sources: ['chinaDaily'], hours: [3], minute: 0 },
  { file: 'daily-nature-skills.yml', name: 'Daily Nature Skills Update', sources: ['natureSkills', 'natureSkillsCommits'], hours: [2, 14], minute: 20 },
  { file: 'daily-scientific-agent-skills.yml', name: 'Daily Scientific Agent Skills Update', sources: ['scientificSkills', 'scientificSkillsCommits'], hours: [2, 14], minute: 40 },
  { file: 'biweekly-journals.yml', name: 'Biweekly MRI Journal Update', sources: ['mrm', 'tmi', 'media'], hours: [2], minute: 0, monthdays: [1, 15] },
];
const GRACE_MINUTES = 90;
const RETRY_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const ISSUE_TITLE = 'Content update monitor: overdue sources';

function expectedDue(schedule, now, graceMinutes = GRACE_MINUTES) {
  const cutoff = new Date(now.getTime() - graceMinutes * 60000);
  for (let days = 0; days < 32; days++) {
    const day = new Date(cutoff);
    day.setUTCDate(day.getUTCDate() - days);
    if (schedule.weekdays && !schedule.weekdays.includes(day.getUTCDay())) continue;
    if (schedule.monthdays && !schedule.monthdays.includes(day.getUTCDate())) continue;
    for (const hour of [...schedule.hours].sort((a, b) => b - a)) {
      day.setUTCHours(hour, schedule.minute, 0, 0);
      if (day <= cutoff) return day;
    }
  }
  throw new Error(`No scheduled slot found for ${schedule.file}`);
}

function evaluate(records, now = new Date(), graceMinutes = GRACE_MINUTES) {
  return schedules.map(schedule => {
    const due = expectedDue(schedule, now, graceMinutes);
    const overdue = schedule.sources.filter(key => {
      const record = records[key];
      const time = Date.parse(record?.savedAt);
      return !record || !Array.isArray(record.items) || !Number.isFinite(time) || time < due.getTime() || time > now.getTime() + 5 * 60000;
    });
    return { ...schedule, due, overdue };
  }).filter(row => row.overdue.length);
}

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
