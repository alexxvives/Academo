# Wrangler Tail Connection Timeout Fix

## Error
```
AggregateError [ETIMEDOUT]: 
    at internalConnectMultiple (node:net:1134:18)
    at afterConnectMultiple (node:net:1715:7) {
  code: 'ETIMEDOUT',
  [errors]: [
    Error: connect ETIMEDOUT 188.114.97.5:443
    Error: connect ETIMEDOUT 188.114.96.5:443
  ]
}
```

## Root Cause
This timeout occurs when trying to connect to Cloudflare's API (IP addresses 188.114.97.5 and 188.114.96.5 are Cloudflare servers). Common causes:
1. **Firewall blocking**: Corporate or local firewall blocking port 443 to Cloudflare
2. **VPN/Proxy**: Network routing issues through VPN or proxy
3. **ISP blocking**: Internet provider blocking or throttling Cloudflare IPs
4. **Cloudflare rate limiting**: Too many requests to Cloudflare API

## Solutions

### Solution 1: Use Cloudflare Dashboard (Easiest)
Instead of `wrangler tail`, use the web-based logs:

1. Go to https://dash.cloudflare.com
2. Select your account
3. Click "Workers & Pages"
4. Click on "akademo" worker
5. Click "Logs" tab (left sidebar)
6. View real-time logs in browser

**Advantages:**
- No local networking issues
- Works from anywhere
- Visual interface with filtering
- Can export logs

### Solution 2: Try with Different Network
```powershell
# 1. Disconnect VPN if using one
# 2. Try mobile hotspot instead of office/home WiFi
# 3. Retry wrangler tail
npx wrangler tail
```

### Solution 3: Use WARP/1.1.1.1
If your ISP is blocking Cloudflare:

1. Download Cloudflare WARP: https://1.1.1.1/
2. Install and enable WARP
3. Retry `npx wrangler tail`

This routes traffic through Cloudflare's network, bypassing ISP blocks.

### Solution 4: Configure Proxy (Advanced)
If behind corporate proxy:

```powershell
# Set proxy environment variables
$env:HTTP_PROXY="http://your-proxy:port"
$env:HTTPS_PROXY="http://your-proxy:port"

# Then try
npx wrangler tail
```

### Solution 5: Check Firewall Rules
Windows Firewall or antivirus might be blocking:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js or add manually
4. Allow both Private and Public networks
5. Retry

### Solution 6: Alternative - Use Logpush
For production monitoring, configure Cloudflare Logpush to send logs to external service:

1. Go to Cloudflare Dashboard
2. Workers & Pages → akademo → Settings → Logpush
3. Configure destination (e.g., HTTP endpoint, S3, Google Cloud Storage)
4. Logs will be sent automatically without need for `wrangler tail`

## Recommended Approach for You

Since `wrangler tail` is failing with network timeout:

**1. Use Cloudflare Dashboard** (immediate solution)
- Visit https://dash.cloudflare.com
- Navigate to Workers & Pages → akademo → Logs
- Keep tab open while testing streams
- Logs appear in real-time with automatic refresh

**2. Test a stream now:**
- Start a Zoom meeting from the platform
- Keep Cloudflare Dashboard logs tab open
- Record for 2+ minutes
- End meeting
- Wait 5-30 minutes
- Watch for `recording.completed` webhook in logs

**3. What to look for in logs:**
```
✅ Good log output:
===== ZOOM WEBHOOK RECEIVED =====
Event: recording.completed
...
✓ Bunny video created successfully!
Video GUID: abc-123-xyz

❌ Error log output:
❌ RECORDING UPLOAD FAILED ❌
Error message: [specific error here]
```

## Why Dashboard Logs Are Better

1. **Always works** - no networking issues
2. **Better filtering** - can search/filter by keyword
3. **Persistent** - logs saved for 24 hours
4. **Export option** - can download logs for analysis
5. **Multiple tabs** - can monitor while working

## Testing Your Webhook Now

1. **Open Dashboard Logs**
   - https://dash.cloudflare.com
   - Workers & Pages → akademo → Logs
   - Keep this tab open

2. **Start Test Stream**
   - Go to any class as teacher
   - Click "Stream" button
   - Join Zoom meeting
   - Enable cloud recording (should auto-enable)
   - Wait 2+ minutes
   - End meeting

3. **Watch for Webhook**
   - Within 5-30 minutes, Zoom processes recording
   - Webhook fires automatically
   - Logs will show in dashboard in real-time

4. **Interpret Results**
   - If you see "✓ Bunny video created" → Success!
   - If you see "❌ RECORDING UPLOAD FAILED" → Share the error message
   - If you see nothing → Webhook not reaching server (check Zoom app settings)

## Network Troubleshooting Commands

If you want to diagnose the connection issue:

```powershell
# Test Cloudflare API connectivity
Test-NetConnection -ComputerName api.cloudflare.com -Port 443

# Check DNS resolution
nslookup api.cloudflare.com

# Test direct IP connection (one of the failed IPs)
Test-NetConnection -ComputerName 188.114.97.5 -Port 443

# Check if wrangler can authenticate at least
npx wrangler whoami
```

If `Test-NetConnection` fails or times out, the issue is definitely local network/firewall related.

## Summary

**Don't worry about `wrangler tail` failing** - use Cloudflare Dashboard instead. It's actually a better solution for monitoring production webhooks anyway.

The key is to have the Dashboard Logs page open when the webhook fires (5-30 min after ending a meeting), so you can see the detailed logs I added earlier.
