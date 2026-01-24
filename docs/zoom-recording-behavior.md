# Zoom Recording Behavior - AKADEMO

## Question: Cloud Recording vs Local Recording

**Q**: When a teacher stops a recording and re-records during a Zoom stream, does it matter if they choose cloud recording vs local recording?

**A**: Yes, it matters significantly.

---

## Recording Types

### 1. **Cloud Recording** ✅ (Recommended)
- **How it works**: Recording is saved to Zoom's cloud storage
- **AKADEMO Integration**: ✅ **Fully Automated**
  - Zoom webhook `recording.completed` fires when processing finishes
  - Our webhook handler automatically downloads the recording from Zoom
  - Recording is uploaded to Bunny Stream CDN
  - `LiveStream.recordingId` is set with the Bunny video GUID
  - Recording appears in the class recordings list immediately
- **Requirements**: 
  - Zoom PRO account with cloud recording enabled
  - Webhook must be configured in Zoom app settings
- **Advantage**: Zero manual work, automatic availability

### 2. **Local Recording** ❌ (Not Supported)
- **How it works**: Recording is saved to the teacher's computer
- **AKADEMO Integration**: ❌ **No Automatic Upload**
  - No webhook is fired
  - Teacher must manually upload the recording file
  - Manual process required to convert to lesson
- **Disadvantage**: Extra work, delayed availability

---

## Recommendation

**Always use Cloud Recording** for AKADEMO streams. 

### Why?
1. **Automatic workflow**: Recording → Bunny → Lesson (no manual steps)
2. **Immediate availability**: Students can access as soon as Zoom finishes processing
3. **No storage concerns**: No local disk space needed
4. **Reliability**: Zoom handles storage, not teacher's computer

---

## What Happens if Teacher Stops and Re-Records?

### Cloud Recording Scenario:
1. **First recording**: Zoom meeting starts with cloud recording enabled
2. **Teacher stops recording**: First recording is saved to cloud
3. **Teacher re-records**: New recording starts, creates separate file
4. **Meeting ends**: Zoom processes both recordings
5. **Webhook fires**: AKADEMO receives `recording.completed` for **both recordings**
6. **Result**: Both recordings are uploaded to Bunny and available as separate videos

**Note**: Currently, AKADEMO only stores the **last recording** in `LiveStream.recordingId`. If you want to support multiple recordings per stream, we would need to:
- Change `recordingId` from `TEXT` to store JSON array of GUIDs
- Update UI to show multiple recordings per stream
- Allow teacher to select which recording(s) to convert to lessons

### Local Recording Scenario:
1. **First recording**: Saved to computer
2. **Teacher stops and re-records**: Second file saved to computer
3. **Meeting ends**: No automatic upload
4. **Result**: Teacher must manually upload both files (tedious)

---

## Current Implementation

**File**: `workers/akademo-api/src/routes/webhooks.ts` - `recording.completed` handler

```typescript
// When Zoom sends recording.completed webhook:
1. Parse recording files from webhook payload
2. Get download URL with fresh access token
3. Send URL to Bunny Stream /fetch endpoint
4. Bunny downloads from Zoom and transcodes
5. Store bunnyGuid in LiveStream.recordingId
```

**File**: `workers/akademo-api/src/routes/live.ts` - Recording check

```typescript
// GET /live/:id/check-recording
// Checks if recording is available in Bunny
// Returns transcoding status
```

---

## Migration Path (If Needed)

If you want to support multiple recordings per stream:

**1. Database Migration**:
```sql
-- Change recordingId to store JSON array
ALTER TABLE LiveStream ADD COLUMN recordingIds TEXT; -- JSON array of GUIDs
-- Keep recordingId for backward compatibility (primary recording)
```

**2. Update Webhook Handler**:
```typescript
// Store all recordings
const recordingGuids = [...]; // All GUIDs from webhook
await db.update('LiveStream', {
  recordingId: recordingGuids[0], // Primary (first/last)
  recordingIds: JSON.stringify(recordingGuids) // All recordings
});
```

**3. Update UI**:
```tsx
{/* Show all recordings */}
{stream.recordingIds && JSON.parse(stream.recordingIds).map(guid => (
  <VideoCard key={guid} bunnyGuid={guid} />
))}
```

---

## Summary

| Recording Type | Automatic Upload | Manual Work | Recommended |
|----------------|------------------|-------------|-------------|
| **Cloud Recording** | ✅ Yes | ❌ None | ✅ **YES** |
| **Local Recording** | ❌ No | ✅ Upload manually | ❌ No |

**Recommendation**: Always instruct teachers to use **Cloud Recording** for seamless integration with AKADEMO.
