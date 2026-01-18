<#
=============================================================================
SYNC BUNNY VIDEOS - Database Cleanup Script
=============================================================================

PURPOSE:
    Synchronize the AKADEMO database with Bunny Stream CDN by removing
    references to videos that no longer exist in Bunny's storage.

WHEN TO RUN THIS:
    - After manually deleting videos from Bunny Stream dashboard
    - When students report "404" or "video not found" errors
    - As part of monthly database maintenance
    - After bulk video deletions

WHY THIS IS NEEDED:
    When you delete videos from Bunny Stream, the database still keeps
    the video references (bunnyGuid). This causes "ghost videos" that
    appear in lessons but can't be played. This script finds and removes
    those orphaned references.

IMPORTANT - VIDEO CACHING:
    Videos deleted from Bunny continue working for 24-48 hours due to:
    - CDN edge cache (Bunny's global network)
    - Browser cache (student devices)
    
    After caches expire, videos return 404 errors. This is when you should
    run this script to clean up the database.

HOW TO RUN:
    1. DRY RUN (Safe - Preview Only):
       .\scripts\sync-bunny-videos.ps1 -DryRun
       
       This shows what would be deleted WITHOUT making changes.
       ALWAYS RUN THIS FIRST to verify the changes.

    2. EXECUTE (Apply Changes):
       .\scripts\sync-bunny-videos.ps1 -Execute
       
       This actually deletes the orphaned video references from database.
       Only run this after reviewing the dry run output!

PREREQUISITES:
    - Environment variables must be set in your PowerShell session:
      $env:BUNNY_STREAM_API_KEY = "your-api-key"
      $env:BUNNY_STREAM_LIBRARY_ID = "your-library-id"
    
    - Wrangler CLI installed: npm install -g wrangler
    - Authenticated with Cloudflare: npx wrangler login

OUTPUT:
    - Console: Colored progress and results
    - File: SQL statements saved to timestamped .sql file (dry run mode)

EXAMPLE OUTPUT:
    ✓ Found 45 videos in database
    ✓ Valid videos: 43
    ✗ Orphaned videos: 2
    
    Generated SQL:
    DELETE FROM Upload WHERE id = 12;
    DELETE FROM Upload WHERE id = 19;

=============================================================================
#>

param(
    [switch]$DryRun = $true,
    [switch]$Execute = $false
)

# Configuration
$BUNNY_API_KEY = $env:BUNNY_STREAM_API_KEY
$BUNNY_LIBRARY_ID = $env:BUNNY_STREAM_LIBRARY_ID
$DATABASE_NAME = "akademo-db"
$BUNNY_API_BASE = "https://video.bunnycdn.com/library/$BUNNY_LIBRARY_ID/videos"

# Color output helpers
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }

# Validate environment variables
if (-not $BUNNY_API_KEY) {
    Write-Error "BUNNY_STREAM_API_KEY environment variable not set"
    exit 1
}

if (-not $BUNNY_LIBRARY_ID) {
    Write-Error "BUNNY_STREAM_LIBRARY_ID environment variable not set"
    exit 1
}

Write-Info "AKADEMO Video Cleanup Script"
Write-Info "=============================="
Write-Host ""

if ($Execute) {
    $DryRun = $false
    Write-Warning "EXECUTE MODE: Changes will be applied to the database!"
} else {
    Write-Info "DRY RUN MODE: No changes will be made"
}

Write-Host ""

# Step 1: Fetch all videos from database
Write-Info "Step 1: Fetching videos from database..."
$dbQuery = "SELECT id, bunnyGuid, lessonId FROM Upload WHERE bunnyGuid IS NOT NULL AND bunnyGuid != ''"
$dbResult = npx wrangler d1 execute $DATABASE_NAME --remote --command "$dbQuery" --json 2>$null | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to query database"
    exit 1
}

$videos = $dbResult.results
$videoCount = $videos.Count
Write-Success "Found $videoCount videos in database"
Write-Host ""

# Step 2: Check each video against Bunny Stream API
Write-Info "Step 2: Validating videos against Bunny Stream..."
$orphanedVideos = @()
$validVideos = 0
$checkCount = 0

foreach ($video in $videos) {
    $checkCount++
    $bunnyGuid = $video.bunnyGuid
    $uploadId = $video.id
    $lessonId = $video.lessonId
    
    Write-Progress -Activity "Checking videos" -Status "$checkCount of $videoCount" -PercentComplete (($checkCount / $videoCount) * 100)
    
    # Check if video exists in Bunny
    try {
        $response = Invoke-WebRequest -Uri "$BUNNY_API_BASE/$bunnyGuid" `
            -Headers @{ "AccessKey" = $BUNNY_API_KEY } `
            -Method GET `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $validVideos++
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            # Video not found in Bunny - mark as orphaned
            $orphanedVideos += @{
                uploadId = $uploadId
                bunnyGuid = $bunnyGuid
                lessonId = $lessonId
            }
            Write-Warning "Orphaned: Upload ID $uploadId (Bunny GUID: $bunnyGuid, Lesson: $lessonId)"
        } else {
            Write-Error "API error checking video $bunnyGuid : $($_.Exception.Message)"
        }
    }
    
    Start-Sleep -Milliseconds 100  # Rate limiting
}

Write-Progress -Activity "Checking videos" -Completed
Write-Host ""

# Step 3: Report findings
Write-Info "Step 3: Summary"
Write-Info "==============="
Write-Success "Valid videos: $validVideos"
Write-Error "Orphaned videos: $($orphanedVideos.Count)"
Write-Host ""

if ($orphanedVideos.Count -eq 0) {
    Write-Success "No orphaned videos found! Database is clean."
    exit 0
}

# Step 4: Generate SQL statements
Write-Info "Step 4: Generating cleanup SQL..."
$sqlStatements = @()

foreach ($orphan in $orphanedVideos) {
    $uploadId = $orphan.uploadId
    $sqlStatements += "DELETE FROM Upload WHERE id = $uploadId;"
}

Write-Host ""
Write-Info "Generated SQL statements:"
Write-Host "=========================="
foreach ($sql in $sqlStatements) {
    Write-Host $sql -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Execute or save SQL
if ($DryRun) {
    Write-Info "DRY RUN: No changes made to database"
    Write-Info "To execute these deletions, run: .\cleanup-orphaned-videos.ps1 -Execute"
    
    # Save SQL to file
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $sqlFile = "cleanup-orphaned-videos-$timestamp.sql"
    $sqlStatements -join "`n" | Out-File -FilePath $sqlFile -Encoding UTF8
    Write-Success "SQL statements saved to: $sqlFile"
} else {
    Write-Warning "Executing DELETE statements..."
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($sql in $sqlStatements) {
        try {
            npx wrangler d1 execute $DATABASE_NAME --remote --command "$sql" 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $successCount++
            } else {
                $errorCount++
                Write-Error "Failed to execute: $sql"
            }
        } catch {
            $errorCount++
            Write-Error "Error executing SQL: $($_.Exception.Message)"
        }
    }
    
    Write-Host ""
    Write-Success "Cleanup complete!"
    Write-Success "Deleted: $successCount videos"
    if ($errorCount -gt 0) {
        Write-Error "Errors: $errorCount"
    }
}

Write-Host ""
Write-Info "Script complete!"
