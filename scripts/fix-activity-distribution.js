// Fix activity distribution in demo-data.ts
// Target: 75% active (<24h), 10% active 7d, 10% active 30d, 5% inactive

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'demo-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('\n🔧 Fixing student activity distribution...\n');

// Define targets: 123 active (<24h), 16 active7d, 16 active30d, 9 inactive
const distributions = {
  active: 123,    // 75%
  active7d: 16,   // 10%
  active30d: 16,  // 10%
  inactive: 9     // 5%
};

console.log('Target distribution:');
console.log(`  ✅ Active (<24h): ${distributions.active} students (75%)`);
console.log(`  🟡 Active 7d:     ${distributions.active7d} students (10%)`);
console.log(`  🟠 Active 30d:    ${distributions.active30d} students (10%)`);
console.log(`  ⚫ Inactive:      ${distributions.inactive} students (5%)\n`);

// Extract all student entries
const studentPattern = /\{ id: 'demo-s\d+',[\s\S]*?lastLoginAt: .*? \}/g;
const students = [];
let match;

while ((match = studentPattern.exec(content)) !== null) {
  students.push({
    fullText: match[0],
    index: match.index
  });
}

console.log(`Found ${students.length} student entries\n`);

// Sort by index to maintain order
students.sort((a, b) => a.index - b.index);

// Generate new timestamps
students.forEach((student, index) => {
  let newTimestamp;
  
  if (index < distributions.active) {
    // Active <24h: Random between 1-23 hours
    const hours = 1 + (index % 23);
    newTimestamp = `new Date(baseDate.getTime() - ${hours} * 60 * 60 * 1000).toISOString()`;
  } else if (index < distributions.active + distributions.active7d) {
    // Active 7d: Between 1-7 days
    const days = 1 + ((index - distributions.active) % 7);
    newTimestamp = `new Date(baseDate.getTime() - ${days} * 24 * 60 * 60 * 1000).toISOString()`;
  } else if (index < distributions.active + distributions.active7d + distributions.active30d) {
    // Active 30d: Between 8-30 days
    const days = 8 + ((index - distributions.active - distributions.active7d) % 23);
    newTimestamp = `new Date(baseDate.getTime() - ${days} * 24 * 60 * 60 * 1000).toISOString()`;
  } else {
    // Inactive: null
    newTimestamp = 'null';
  }
  
  student.newTimestamp = newTimestamp;
});

// Replace all lastLoginAt values (reverse order to maintain indices)
students.reverse().forEach(student => {
  const updated = student.fullText.replace(/lastLoginAt: .*? \}/, `lastLoginAt: ${student.newTimestamp} }`);
  content = content.substring(0, student.index) + updated + content.substring(student.index + student.fullText.length);
});

// Write back
fs.writeFileSync(filePath, content);

console.log('✅ Successfully updated all student activity timestamps!');
console.log('📊 New distribution applied: 75/10/10/5\n');
