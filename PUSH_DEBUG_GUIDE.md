# Push Notification Debugging Guide

## Quick Start

1. **Open the Debug Tool**: Navigate to `/push-debug.html` in your browser
2. **Run through all steps** in order (1-5)
3. **Check the logs** at the bottom of the page

---

## Step-by-Step Debugging

### Step 1: Check Environment Variables on Vercel

Go to your Vercel project settings → Environment Variables and verify these are set:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: After adding environment variables, you must **redeploy** your Vercel app for them to take effect.

---

### Step 2: Verify Service Worker Registration

**In Browser DevTools (F12)**:
1. Go to **Application** tab → **Service Workers** (left sidebar)
2. Check if `sw.js` is listed and shows "Activated"
3. If not active, check the **Console** tab for errors

**Expected output in console**:
```
[SW] Install event triggered
[SW] Cache opened successfully
[SW] Activate event triggered
[SW] Old caches cleaned
Service Worker registered: /
```

**Common Issues**:
- ❌ "Service workers not supported" → Browser doesn't support SW (unlikely in Chrome/Brave)
- ❌ "Failed to register" → Check that `/sw.js` exists and is served correctly
- ❌ No logs appearing → SW file might have syntax errors

---

### Step 3: Check Push Subscription

**In Browser Console**, run:
```javascript
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.getSubscription();
console.log('Subscription:', sub);
```

**Results**:
- `null` → Subscription was never created or was lost
- Object with `endpoint` → Subscription exists locally

**If null**, you need to subscribe:
1. Go to your app's settings page
2. Click "Enable" on Push Notifications
3. Grant permission when prompted
4. Check console for logs

---

### Step 4: Verify Supabase Data

**In Supabase Dashboard**:
1. Go to SQL Editor
2. Run:
```sql
SELECT * FROM push_subscriptions ORDER BY created_at DESC LIMIT 10;
```

**Expected columns**:
- `id` (uuid)
- `display_name` (text)
- `subscription` (jsonb)
- `created_at` (timestamp)

**If table doesn't exist**, run this migration:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_display_name ON push_subscriptions(display_name);
```

---

### Step 5: Test Push Flow Manually

**Using the Debug Tool** (`/push-debug.html`):
1. Enter your display name
2. Click "Create Subscription"
3. Verify it saves to Supabase (check logs)
4. Click "Send Test Push"
5. You should see a notification

**Expected Console Logs**:
```
[Push] Subscription created successfully
[Push] Saved to Supabase successfully
[Push API] Received push request: { displayName: "...", ... }
[Push API] Found subscriptions for ... : 1
[Push API] Sending push to subscription 1 of 1
[Push API] Push sent successfully
[SW] Push event received
[SW] Showing notification: Test Notification
```

---

## Common Issues & Solutions

### Issue 1: "VAPID Public Key missing"

**Symptoms**:
- Debug tool shows "VAPID Public Key: ❌ Missing"
- Subscription fails immediately

**Solution**:
1. Check Vercel environment variables
2. Verify `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set (must start with `NEXT_PUBLIC_` to be client-accessible)
3. **Redeploy** Vercel app

---

### Issue 2: Subscription created but not saved to Supabase

**Symptoms**:
- `getSubscription()` returns object
- Supabase table is empty
- Console shows "Failed to save subscription to Supabase"

**Solution**:
1. Check Supabase credentials in Vercel
2. Verify `push_subscriptions` table exists
3. Check browser console for specific error message
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

---

### Issue 3: Push API returns "No subscriptions found"

**Symptoms**:
- Test push returns `{ message: 'No subscriptions found' }`
- But Supabase has data

**Possible causes**:
1. **Display name mismatch**: The `displayName` in the push request doesn't match what's in Supabase
2. **Case sensitivity**: "John" ≠ "john"

**Solution**:
```sql
-- Check exact display names in your table
SELECT DISTINCT display_name FROM push_subscriptions;
```

---

### Issue 4: Push sends but no notification appears

**Symptoms**:
- Push API returns success
- Service worker logs show "Push event received"
- But no notification appears

**Check**:
1. **Notification permission**: Run in console:
   ```javascript
   console.log('Permission:', Notification.permission);
   ```
   Should be `"granted"`

2. **Focus mode / DND**: Check if browser or OS is in Do Not Disturb mode

3. **Browser background**: Some browsers block notifications when tab is in foreground

4. **Service worker push handler**: Check for errors in:
   - DevTools → Application → Service Workers → "Inspect" link

---

### Issue 5: Push works on desktop but not mobile

**Symptoms**:
- Notifications appear on Chrome desktop
- But not on Chrome/Brave mobile

**Possible causes**:
1. **Different browser profiles**: Mobile browsers create separate push subscriptions
2. **Battery optimization**: Android may block background push
3. **Browser support**: Ensure mobile browser supports push

**Solution**:
- Subscribe separately on each device/browser
- Each device will have its own subscription in Supabase

---

### Issue 6: 410 Gone errors

**Symptoms**:
```
[Push API] Push send failed: Status code 410
```

**Meaning**: The push subscription has expired (common after browser updates)

**Solution**:
- User needs to re-subscribe
- Your code already handles this by removing 410 subscriptions
- Implement automatic re-subscription on app load

---

## Debug Checklist

Run through this checklist systematically:

- [ ] Environment variables set in Vercel (all 4 keys)
- [ ] Vercel app redeployed after adding env vars
- [ ] Service worker shows "Activated" in DevTools
- [ ] Console shows `[SW] Install` and `[SW] Activate` logs
- [ ] Notification permission is "granted"
- [ ] `getSubscription()` returns non-null value
- [ ] Supabase `push_subscriptions` table has at least 1 row
- [ ] Display name in push request matches Supabase data
- [ ] Push API logs show "Push sent successfully"
- [ ] Service worker logs show "Push event received"

---

## Generating New VAPID Keys

If your keys are invalid or missing:

**Using Node.js**:
```bash
npm install web-push
npx web-push generate-vapid-keys
```

Output:
```
Public Key:
BN...
Private Key:
...
```

**Add to Vercel**:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Public Key
- `VAPID_PRIVATE_KEY` = Private Key

---

## Additional Debugging Commands

### Check all subscriptions in Supabase:
```sql
SELECT 
  display_name,
  subscription->>'endpoint' as endpoint,
  created_at
FROM push_subscriptions
ORDER BY created_at DESC;
```

### Count subscriptions per user:
```sql
SELECT 
  display_name,
  COUNT(*) as subscription_count
FROM push_subscriptions
GROUP BY display_name
ORDER BY subscription_count DESC;
```

### Clear all subscriptions (for testing):
```sql
DELETE FROM push_subscriptions;
```

---

## When Nothing Works

1. **Clear everything and start fresh**:
   ```javascript
   // In browser console
   const reg = await navigator.serviceWorker.getRegistration();
   await reg.unregister();
   
   const subs = await reg.pushManager.getSubscription();
   await subs.unsubscribe();
   
   await caches.keys().then(k => Promise.all(k.map(n => caches.delete(n))));
   
   location.reload();
   ```

2. **Redeploy to Vercel**:
   ```bash
   git push
   # Wait for Vercel build to complete
   ```

3. **Try in incognito mode** (no cached data)

4. **Try a different browser** (isolates browser-specific issues)

---

## Contact / Next Steps

If you've completed all steps and push still doesn't work:
1. Copy all console logs from the debug tool
2. Copy your Supabase `push_subscriptions` table contents (anonymized)
3. Check Vercel function logs for the `/api/push/send` route
