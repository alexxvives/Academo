# Fix activity distribution in demo-data.ts
# Target: 75% active (<24h), 10% 7d, 10% 30d, 5% inactive

Write-Host "`nActivity Distribution Fixer" -ForegroundColor Cyan
Write-Host "============================`n"

# Read the demo-data.ts file
$filePath = "c:\Users\alexx\Desktop\Projects\AKADEMO\src\lib\demo-data.ts"
$content = Get-Content $filePath -Raw

# Target distribution for 164 students
$total = 164
$active24h = 123  # 75%
$active7d = 16    # 10%
$active30d = 16   # 10%
$inactive = 9     # 5%

Write-Host "Target distribution:"
Write-Host "  Active (<24h): $active24h students (75%)" -ForegroundColor Green
Write-Host "  Active 7d:     $active7d students (10%)" -ForegroundColor Yellow
Write-Host "  Active 30d:    $active30d students (10%)" -ForegroundColor Orange
Write-Host "  Inactive:      $inactive students (5%)" -ForegroundColor Red
Write-Host ""

# Generate timestamp code for each category
function Get-TimestampCode($hours) {
    if ($hours -eq $null) {
        return "null"
    }
    if ($hours -lt 24) {
        return "new Date(baseDate.getTime() - $hours * 60 * 60 * 1000).toISOString()"
    } else {
        $days = [Math]::Floor($hours / 24)
        $remainingHours = $hours % 24
        if ($remainingHours -eq 0) {
            return "new Date(baseDate.getTime() - $days * 24 * 60 * 60 * 1000).toISOString()"
        } else {
            return "new Date(baseDate.getTime() - ($days * 24 + $remainingHours) * 60 * 60 * 1000).toISOString()"
        }
    }
}

# Parse current students and reassign lastLoginAt
$pattern = '\{ id: ''demo-s(\d+)'',.*?lastLoginAt: (.*?) \}'
$matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Host "Found $($matches.Count) student entries"
Write-Host "Generating new timestamps..." -ForegroundColor Cyan

$replacements = @()
$currentIndex = 0

foreach ($match in $matches) {
    $studentId = $match.Groups[1].Value
    $oldTimestamp = $match.Groups[2].Value
    
    # Determine new timestamp based on distribution
    $newTimestamp = if ($currentIndex -lt $active24h) {
        # Active <24h: Random between 1-23 hours
        $hours = 1 + ($currentIndex % 23)
        Get-TimestampCode $hours
    } elseif ($currentIndex -lt ($active24h + $active7d)) {
        # Active 7d: Random between 1-7 days
        $days = 1 + (($currentIndex - $active24h) % 7)
        Get-TimestampCode ($days * 24)
    } elseif ($currentIndex -lt ($active24h + $active7d + $active30d)) {
        # Active 30d: Random between 8-30 days
        $days = 8 + (($currentIndex - $active24h - $active7d) % 23)
        Get-TimestampCode ($days * 24)
    } else {
        # Inactive: null
        "null"
    }
    
    $replacements += @{
        Old = $oldTimestamp
        New = $newTimestamp
        Id = $studentId
    }
    
    $currentIndex++
}

# Apply replacements (showing first 10 as sample)
Write-Host "`nSample replacements (first 10):" -ForegroundColor Yellow
$replacements[0..9] | ForEach-Object {
    Write-Host "  Student $($_.Id): $($_.Old) -> $($_.New)"
}

Write-Host "`n`n⚠️  MANUAL STEP REQUIRED ⚠️" -ForegroundColor Red
Write-Host "Due to the complexity of 164 student entries, please run this Node.js script instead:`n"

$nodeScript = @'
// Run this to fix activity distribution
const fs = require('fs');

const filePath = 'src/lib/demo-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Define targets: 123 active (<24h), 16 active7d, 16 active30d, 9 inactive
const baseDate = 'baseDate.getTime()';
const students = [];

// Parse all students
const regex = /\{ id: 'demo-s(\d+)',.*?lastLoginAt: (.*?) \}/gs;
let match;
let index = 0;

while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const fullMatch = match[0];
    
    let newTimestamp;
    if (index < 123) {
        // Active <24h
        const hours = 1 + (index % 23);
        newTimestamp = `new Date(${baseDate} - ${hours} * 60 * 60 * 1000).toISOString()`;
    } else if (index < 139) {
        // Active 7d
        const days = 1 + ((index - 123) % 7);
        newTimestamp = `new Date(${baseDate} - ${days} * 24 * 60 * 60 * 1000).toISOString()`;
    } else if (index < 155) {
        // Active 30d
        const days = 8 + ((index - 139) % 23);
        newTimestamp = `new Date(${baseDate} - ${days} * 24 * 60 * 60 * 1000).toISOString()`;
    } else {
        // Inactive
        newTimestamp = 'null';
    }
    
    students.push({ fullMatch, newTimestamp });
    index++;
}

// Replace all lastLoginAt values
students.forEach(s => {
    const updated = s.fullMatch.replace(/lastLoginAt: .*? \}/, `lastLoginAt: ${s.newTimestamp} }`);
    content = content.replace(s.fullMatch, updated);
});

fs.writeFileSync(filePath, content);
console.log(`✅ Updated ${students.length} students with new activity distribution`);
console.log('   75% active (<24h), 10% active 7d, 10% active 30d, 5% inactive');
'@

$nodeScriptPath = "scripts\fix-students-activity.js"
$nodeScript | Out-File $nodeScriptPath -Encoding UTF8
Write-Host "Node.js script saved to: $nodeScriptPath" -ForegroundColor Green
Write-Host "`nRun with: node $nodeScriptPath" -ForegroundColor Cyan
