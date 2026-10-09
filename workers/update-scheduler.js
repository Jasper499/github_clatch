import monitor from '../scripts/monitor_updates.cjs';

async function requestMonitor(env, scheduledTime) {
  const now = new Date(scheduledTime);
  const records = {};
  await Promise.all(monitor.schedules.flatMap(row => row.sources).map(async key => {
    const response = await fetch(`https://jasper499.github.io/github_clatch/data/sources/${key}.lite.json?t=${scheduledTime}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (response.status === 404) { records[key] = null; return; }
    if (!response.ok) throw new Error(`Snapshot fetch failed: ${key} (${response.status})`);
    records[key] = await response.json();
  }));
  const overdue = monitor.evaluate(records, now, 0);
  if (!overdue.length) return;
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN secret is missing.');
  const response = await fetch('https://api.github.com/repos/Jasper499/github_clatch/actions/workflows/monitor-updates.yml/dispatches', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'hjl-clatch-update-scheduler',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main', inputs: { recovery_grace_minutes: '0' } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Monitor dispatch failed (${response.status}); check secret permissions and expiry.`);
  console.log(`Requested monitor for ${overdue.map(row => row.file).join(', ')}.`);
}

export default {
  async scheduled(controller, env) { await requestMonitor(env, controller.scheduledTime); },
  fetch() { return Response.json({ service: 'hjl-clatch-update-scheduler', trigger: 'cron only' }); },
};
