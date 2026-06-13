const fs = require('fs');

const path = 'g:/AI-Lead/src/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file seems to be UTF-8 but contains garbled characters because it was decoded from UTF-8 into Windows-1252 and then saved back as UTF-8.
// We can find all those "â..." substrings and replace them.
// Or we can just do a mass replace.

const replacements = {
  "â€”": "—",
  "â€¢": "•",
  "ðŸ”¥": "🔥",
  "âš ï¸ ": "⚠️",
  "ðŸ“ˆ": "📈",
  "âœ…": "✅",
  "â†’": "→",
  "â °": "⏰",
  "ðŸ“…": "📅",
  "ðŸ“ž": "📞",
  "ðŸ‘ ï¸ ": "👁️",
  "âœ✨": "✨",
  "âœ¨": "✨",
  "â• ": "═",
  "â”€": "─",
  "Â·": "·",
  "ðŸ’°": "💰",
  "ðŸ¤–": "🤖",
  "ðŸŒ ": "🌐",
  "ðŸš€": "🚀",
  "ðŸ’¡": "💡",
  "âš¡": "⚡",
  "âœ‰ï¸ ": "✉️",
  "ðŸ“§": "📧"
};

let modified = content;
for (const [bad, good] of Object.entries(replacements)) {
  modified = modified.split(bad).join(good);
}

fs.writeFileSync(path, modified, 'utf8');
console.log("Fixed Dashboard.tsx");
