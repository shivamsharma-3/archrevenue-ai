const fs = require('fs');

const corrupted = "â€” â€¢ ðŸ”¥ âš ï¸  ðŸ“ˆ âœ… â†’ â ° ðŸ“… ðŸ“ž ðŸ‘ ï¸  âœ¨";
const fixed = Buffer.from(corrupted, 'latin1').toString('utf8');
console.log("Fixed:", fixed);
