# Zoom API Scope Configuration Fix

## Issue
Error creating Zoom stream: `Invalid access token, does not contain scopes:[user:read:user:admin, user:read:user]`

## Root Cause
The Zoom Server-to-Server OAuth app is missing required scopes to read user information.

## Solution

### Step 1: Go to Zoom App Marketplace
1. Visit https://marketplace.zoom.us/
2. Sign in with your Zoom account
3. Click "Develop" → "Build App"
4. Find your Server-to-Server OAuth app

### Step 2: Add Required Scopes
1. Click on your app name
2. Go to "Scopes" tab
3. Add the following scopes:
   - ✅ `user:read:user` - View user information
   - ✅ `meeting:write:meeting` - Create meetings (already should have this)
   - ✅ `meeting:read:meeting` - Read meeting information
   - ✅ `meeting:read:list_past_participants:admin` - Read past participants (for analytics)

### Step 3: Activate the App
1. After adding scopes, click "Continue"
2. Make sure the app is **Activated** (not just created)
3. Copy the credentials again if needed

### Current Zoom Configuration Location
Your Zoom credentials are stored in Cloudflare Workers secrets:
- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`

These are set via Cloudflare Dashboard or `wrangler secret put` command.

### Verify Configuration
After updating scopes, test the Zoom integration:
1. Go to any class page
2. Click "🔴 Stream" button
3. Should create a Zoom meeting without errors

## Technical Details

The error occurs in `src/lib/zoom.ts` at line 86:
```typescript
const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

This endpoint requires `user:read:user` or `user:read:user:admin` scope.

## Alternative: Use Email Instead of User ID
If you cannot add scopes, you can modify `src/lib/zoom.ts` to use email directly:

```typescript
// Instead of fetching user ID, use the account owner's email
const meetingResponse = await fetch(`https://api.zoom.us/v2/users/me/meetings`, {
  // ... rest of code
});
```

But adding the proper scopes is the recommended approach.
