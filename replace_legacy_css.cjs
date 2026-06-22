const fs = require('fs');
const files = [
  'src/pages/PipelinePage.tsx',
  'src/pages/InsightsPage.tsx',
  'src/pages/ArticlePage.tsx',
  'src/pages/CommunityForumPage.tsx',
  'src/pages/DesignSystemPage.tsx',
  'src/pages/HelpCenterPage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/SettingsPage.tsx',
  'src/pages/SystemStatusPage.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content
    .replace(/bg-slate-/g, 'bg-surface-')
    .replace(/bg-zinc-/g, 'bg-surface-')
    .replace(/text-slate-/g, 'text-text-')
    .replace(/text-zinc-/g, 'text-text-')
    .replace(/border-slate-/g, 'border-border-')
    .replace(/border-zinc-/g, 'border-border-')
    .replace(/hover:bg-surface-50/g, 'hover:bg-surface-hover')
    .replace(/bg-white\/\[0\.0[0-9]\]/g, 'bg-surface-secondary')
    .replace(/bg-surface-50/g, 'bg-surface-secondary')
    .replace(/bg-surface-100/g, 'bg-surface-hover')
    .replace(/bg-surface-200/g, 'bg-surface-hover')
    .replace(/bg-surface-800/g, 'bg-surface-secondary')
    .replace(/bg-surface-900/g, 'bg-surface-primary')
    .replace(/text-text-500/g, 'text-text-secondary')
    .replace(/text-text-800/g, 'text-text-primary')
    .replace(/text-text-900/g, 'text-text-primary')
    .replace(/border-border-200/g, 'border-border-default')
    .replace(/border-border-800/g, 'border-border-default')
    .replace(/text-text-700/g, 'text-text-secondary')
    .replace(/border-border-300/g, 'border-border-default')
    .replace(/border-border-100/g, 'border-border-default')
    .replace(/text-text-400/g, 'text-text-tertiary')
    .replace(/text-text-600/g, 'text-text-secondary')
    .replace(/rounded-xl/g, 'rounded-[var(--radius-card)]')
    .replace(/rounded-2xl/g, 'rounded-[var(--radius-card)]')
    .replace(/shadow-xl/g, 'shadow-sm');
  fs.writeFileSync(file, content);
}
console.log('Legacy CSS Replaced!');
