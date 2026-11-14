import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
const api = 'https://daily-window-world-2026.fondquail2.chatgpt.site/api/issues';
const file = new URL('../stories.js', import.meta.url);
const context = { window: {} };
vm.runInNewContext(await readFile(file, 'utf8'), context);
const existing = context.window.DW_ISSUES;
if (!Array.isArray(existing) || !existing.length) throw new Error('Existing editions missing');
const response = await fetch(api, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error('Original Site unavailable: ' + response.status);
const incoming = await response.json();
if (!Array.isArray(incoming)) throw new Error('Invalid edition list');
const byDate = new Map(existing.map(issue => [issue.date, issue]));
for (const issue of incoming) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue?.date) || !Array.isArray(issue.stories) || issue.stories.length < 3 || issue.stories.length > 5) throw new Error('Invalid issue');
  for (const story of issue.stories) {
    if (!story.sourceUrl?.startsWith('https://') || !Array.isArray(story.b1) || !Array.isArray(story.b2) || !Array.isArray(story.vocab)) throw new Error('Incomplete story');
  }
  byDate.set(issue.date, issue);
}
const sorted = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
if (sorted.length !== existing.length || sorted.some((issue, index) => issue.date !== existing[index].date)) {
  await writeFile(file, 'window.DW_ISSUES = ' + JSON.stringify(sorted, null, 2) + ';\n');
  console.log('Archived ' + sorted.length + ' editions');
} else console.log('No new edition');
