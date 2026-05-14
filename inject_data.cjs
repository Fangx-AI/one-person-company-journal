const fs = require('fs');

const entriesData = fs.readFileSync('journal_entries.txt', 'utf-8');
const journalTsx = fs.readFileSync('src/pages/Journal.tsx', 'utf-8');

const startMarker = 'const journalEntries: JournalEntry[] = [';
const startIdx = journalTsx.indexOf(startMarker);
if (startIdx < 0) {
  console.error('Could not find start marker');
  process.exit(1);
}

// Find the closing ] of the array by searching for "const milestones"
const milestonesIdx = journalTsx.indexOf('const milestones');
if (milestonesIdx < 0) {
  console.error('Could not find milestones marker');
  process.exit(1);
}

// Find the ] that closes the journalEntries array (last ] before milestones)
let closingBracketIdx = journalTsx.lastIndexOf(']', milestonesIdx);
if (closingBracketIdx < 0) {
  console.error('Could not find closing bracket');
  process.exit(1);
}

const newContent = journalTsx.substring(0, startIdx + startMarker.length) +
  '\n' + entriesData +
  journalTsx.substring(closingBracketIdx);

fs.writeFileSync('src/pages/Journal.tsx', newContent, 'utf-8');

console.log('Data injected successfully!');
console.log(`File size: ${(newContent.length / 1024).toFixed(1)} KB`);
