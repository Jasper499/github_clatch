// Shared UTC schedule rules for the browser, Actions and Cloudflare.
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


const UpdateSchedule = { schedules, expectedDue, evaluate };
if (typeof module !== "undefined") module.exports = UpdateSchedule;
