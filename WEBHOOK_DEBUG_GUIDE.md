# Webhook Debugging Guide

## Problem
Stream recordings show "Error de grabación" (recording_failed status) and participants show "___" instead of being automatically uploaded to Bunny Stream.

## What Should Happen

1. **Teacher starts stream** → Zoom meeting created → `meeting.started` webhook fires
2. **Meeting goes live** → Status updates to "active" in database
3. **Teacher ends meeting** → `meeting.ended` webhook fires → Status updates to "ended"
4. **Zoom processes recording** (5-30 minutes) → `recording.completed` webhook fires
5. **Webhook handler**:
   - Downloads recording from Zoom
   - Uploads to Bunny Stream
   - Stores video GUID in `LiveStream.recordingId`
   - Updates status to "ended"
   - Fetches participant count from Zoom API
   - Creates notification for teacher

## Enhanced Debug Logging

I've added comprehensive logging to `/api/webhooks/zoom`. Now every webhook event will log:

```
===== ZOOM WEBHOOK RECEIVED =====
Event: recording.completed
Timestamp: 2026-01-04T12:34:56.789Z
Full payload: { ... }

===== HANDLING RECORDING COMPLETED =====
Meeting ID: 123456789
Topic: Mi Clase
Recording files count: 2
Recording files: [...]
Download token present: true

✓ LiveStream found: { id, classId, teacherId, title }
✓ Best recording selected: { type, size, id }

--- Getting download URL ---
Using download token from webhook payload
Download URL ready (length): 250

--- Uploading to Bunny Stream ---
Video title: Mi Clase - 04/01/2026
Starting upload...
✓ Bunny video created successfully!
Video GUID: abc-123-xyz
Video details: { ... }

--- Updating database ---
✓ LiveStream updated with recording ID

--- Fetching participants ---
Meeting ID: 123456789
✓ Stored 15 participants for stream xyz-789

===== RECORDING COMPLETED HANDLER FINISHED =====
```

If something fails:
```
❌ RECORDING UPLOAD FAILED ❌
Error type: TypeError
Error message: Failed to fetch
Error stack: [full stack trace]
Stream status updated to recording_failed
```

## How to View Logs

### Option 1: Real-Time Tail (Recommended)
```powershell
npx wrangler tail
```
This shows live logs from your deployed worker. Keep this running in a terminal and trigger the webhook to see real-time output.

### Option 2: Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Select your account → Workers & Pages
3. Click on "akademo" worker
4. Click "Logs" tab
5. View historical logs (up to 24 hours)

### Option 3: Logpush (Production)
For production monitoring, configure Cloudflare Logpush to send logs to external service (Datadog, Splunk, etc.)

## Testing the Webhook

### Test with Zoom Webhook Validator
1. Go to Zoom Marketplace → Your App → Feature → Event Subscriptions
2. Enter webhook URL: `https://akademo-edu.com/api/webhooks/zoom`
3. Click "Validate" - should receive `endpoint.url_validation` event

### Simulate Recording Completed
You can manually test the webhook by starting a real Zoom meeting:
1. Go to any class as teacher
2. Click "Stream" button
3. Start the meeting in Zoom
4. Record the meeting (automatic if cloud recording enabled)
5. End the meeting
6. Wait 5-30 minutes for Zoom to process recording
7. Zoom will fire `recording.completed` webhook

### Check Webhook Events in Zoom
1. Zoom Marketplace → Your App → Feature → Event Subscriptions
2. View "Event Subscription History" at bottom
3. Shows all webhooks sent, their status codes, and retry attempts

## Common Failure Points

### 1. No Webhook Received
**Symptom**: Status stays "ended", never changes to "recording_failed"
**Cause**: Webhook not configured or URL incorrect
**Check**:
```bash
# Verify webhook URL is accessible
curl https://akademo-edu.com/api/webhooks/zoom
```

### 2. Webhook Received But Recording Not Found
**Symptom**: Logs show "❌ ERROR: No MP4 recording found"
**Cause**: 
- Cloud recording not enabled in Zoom account settings
- Meeting too short (< 1 minute) - Zoom doesn't save recording
- Recording still processing (webhook fired too early)

**Fix**: 
- Enable cloud recording in Zoom account settings
- Ensure meeting lasts at least 2 minutes
- Check "Recording Management" in Zoom web portal

### 3. Download URL Fails
**Symptom**: Logs show error at "Getting download URL" step
**Cause**: 
- Download token expired
- Insufficient Zoom API permissions
- Recording deleted before webhook processed

**Fix**: Ensure Zoom app has these scopes:
- `recording:read:admin`
- `cloud_recording:read:admin`

### 4. Bunny Upload Fails
**Symptom**: Logs show error at "Uploading to Bunny Stream" step
**Cause**:
- Bunny API key invalid
- Bunny library ID incorrect
- Network timeout (large file)
- URL not accessible from Cloudflare

**Fix**:
```bash
# Test Bunny credentials
curl -X GET "https://video.bunnycdn.com/library/571240/videos" \
  -H "AccessKey: YOUR_BUNNY_API_KEY"
```

### 5. Participant Fetch Fails
**Symptom**: Participants show "___" or null
**Cause**:
- Missing Zoom scope: `meeting:read:list_past_participants:admin`
- Zoom API call timing (must wait after meeting ends)
- Meeting not found in past meetings list

**Fix**: 
- Add required scope in Zoom app settings
- Click "Obtener" button in streams dashboard to manually retry

## Manual Recovery

If automatic upload failed, you can manually upload:

1. Download recording from Zoom:
   - Go to https://zoom.us/recording
   - Find the meeting
   - Download MP4 file

2. Upload via Streams Dashboard:
   - Go to `/dashboard/teacher/streams`
   - Find the failed stream
   - Click "Subir Grabación"
   - Select the downloaded MP4

3. Manually fetch participants:
   - Click "Obtener" button next to "___"
   - This calls `/api/zoom/participants` with the stream ID

## Next Steps After Debugging

1. **Start a test stream**: Create a short (2-5 minute) test meeting
2. **Run wrangler tail**: Keep terminal open with `npx wrangler tail`
3. **End the meeting**: Stop recording and end
4. **Watch logs**: Within 5-30 minutes, you should see the webhook logs
5. **Check streams dashboard**: Verify recording appears or see specific error

If you see the logs, share them to pinpoint exactly where the process fails.

## Quick Diagnostic Commands

```powershell
# Check if webhook endpoint is accessible
curl https://akademo-edu.com/api/webhooks/zoom

# View real-time worker logs
npx wrangler tail

# Check database for stream status
npx wrangler d1 execute akademo-db --remote --command "SELECT id, title, status, recordingId FROM LiveStream ORDER BY createdAt DESC LIMIT 5"

# Check if recording exists in Bunny
# Replace GUID with actual recordingId from database
curl -X GET "https://video.bunnycdn.com/library/571240/videos/YOUR_GUID" \
  -H "AccessKey: YOUR_BUNNY_API_KEY"
```

## Expected Timeline

- **T+0s**: Meeting ends
- **T+5-30min**: Zoom finishes processing recording
- **T+5-30min**: `recording.completed` webhook fires
- **T+5-30min + 10s**: Recording downloaded from Zoom
- **T+5-30min + 30s-2min**: Upload to Bunny Stream (depends on file size)
- **T+5-30min + 2min**: Database updated, teacher notified
- **T+5-30min + 2min**: Bunny Stream starts transcoding (5-15 min)
- **T+10-45min**: Video ready to watch

The "Error de grabación" status means the webhook handler caught an error at some point in this process. The new detailed logs will show exactly where.
