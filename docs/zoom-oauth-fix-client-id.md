# Fixing Zoom OAuth "Invalid client_id" Error

## Error
```json
{"status":false,"errorCode":4702,"errorMessage":"Invalid client_id: sHMNFyqHQCGV5TpqkPo2Uw","result":null}
```

## Root Cause
The Zoom OAuth app needs to have the correct **Redirect URL for OAuth** configured in the Zoom Marketplace.

## Solution

### Step 1: Go to Zoom Marketplace
1. Visit: https://marketplace.zoom.us/
2. Click "Develop" → "Build App"
3. Find your OAuth app (client ID: sHMNFyqHQCGV5TpqkPo2Uw)
4. Click "View" or "Edit"

### Step 2: Add Redirect URI
1. Go to "Basic Information" tab
2. Scroll to "OAuth Redirect URL" section
3. Add this URL:
   ```
   https://akademo-edu.com/api/zoom/oauth/callback
   ```
4. Click "Save" or "Add"

### Step 3: Verify OAuth Settings
Make sure these settings are configured:

**OAuth Redirect URLs:**
- `https://akademo-edu.com/api/zoom/oauth/callback`

**OAuth Allow List (optional but recommended):**
- `https://akademo-edu.com`

**Scopes Required:**
- `meeting:write:meeting:admin` - Create meetings
- `meeting:read:meeting:admin` - Read meeting details
- `meeting:read:participant:admin` - Track participants
- `meeting:read:list_past_participants:admin` - Past participant analytics
- `cloud_recording:read:list_recording_files:admin` - Access recordings
- `cloud_recording:read:content:master` - Download recordings
- `user:read:user:admin` - Get user info

### Step 4: Update App Status
If the app is in "Development" mode:
1. You need to publish it OR
2. Add test users to allow them to connect

If you want to keep it in development:
- Go to "App Credentials" tab
- Scroll to "Test Users" section
- Add email addresses of academy owners who will connect Zoom

### Step 5: Test
After configuring:
1. Go to AKADEMO profile page
2. Click "Conectar Zoom"
3. Should redirect to Zoom authorization page
4. After authorizing, should redirect back to profile with success message

## Alternative: Check Environment Variable

Verify the client ID is correctly set in Cloudflare:

```bash
# Check wrangler.toml has:
NEXT_PUBLIC_ZOOM_CLIENT_ID = "sHMNFyqHQCGV5TpqkPo2Uw"
```

## Common Issues

### Issue: "Redirect URI mismatch"
**Solution**: Make sure the redirect URI in Zoom app matches exactly:
- `https://akademo-edu.com/api/zoom/oauth/callback` (no trailing slash)

### Issue: "App not published"
**Solution**: Either:
- Publish the app to production OR
- Add test users in development mode

### Issue: Still getting invalid client_id
**Possible causes**:
1. Wrong client ID in environment variable
2. App was deleted and recreated (new client ID)
3. Typo in client ID
4. Need to wait a few minutes for Zoom's cache to update

## Current Configuration

**Client ID**: `sHMNFyqHQCGV5TpqkPo2Uw`  
**Redirect URI**: `https://akademo-edu.com/api/zoom/oauth/callback`  
**App Type**: OAuth  
**Grant Type**: Authorization Code

## Need Help?

If the issue persists:
1. Double-check the client ID in Zoom app credentials
2. Verify the app is active (not suspended)
3. Check Zoom Marketplace email for any notifications
4. Contact Zoom Support with app client ID

---

**Note**: After making changes in Zoom Marketplace, it may take 5-10 minutes for the changes to propagate.
