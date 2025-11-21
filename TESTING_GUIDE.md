# 🧪 Quick Testing Guide - Robot Assistant & PayU

## Prerequisites
- Both servers running (backend on :5000, frontend on :5173)
- MongoDB connected
- Gemini API key configured
- Logged into dashboard

---

## Test 1: Robot Speech Bubble (30 seconds)

1. **Go to Dashboard**: http://localhost:5173/dashboard
2. **Look bottom-right**: Cute robot should appear
3. **Check speech bubble**: Should show dynamic AI message (not hard-coded)
4. **Open DevTools Console**: Look for:
   ```
   🤖 Generating NEW robot speech for user...
   ✅ Robot speech generated: "..."
   ```
5. **Wait 5 minutes**: Refresh page, speech should change
6. **Before 5 minutes**: Refresh page, should see cache hit:
   ```
   ✅ Robot speech cache HIT for user...
   ```

**Expected**: Dynamic, contextual message based on your actual scan data.

---

## Test 2: Mini-Chat (Free User) (2 minutes)

1. **Click the robot**: Mini-chat drawer opens
2. **Send message**: "How can I save money?"
3. **Check response**: Should get real Gemini AI answer
4. **Send second message**: "Tell me more"
5. **Check response**: Should see upgrade prompt:
   ```
   "Want unlimited AI help + weekly auto-scans? 
   Upgrade to Pro — we need your support to keep building this 🔥"
   ```
6. **Check console**:
   ```
   💬 Free user abc123 chat message 1/1: "How can I save money?"
   ✅ Chat response generated for Free user
   ⏱️ Free user abc123 hit message limit (1/1)
   ```

**Expected**: 1 real message, then upgrade prompt.

---

## Test 3: Mini-Chat (Pro User) (3 minutes)

1. **Upgrade to Pro** (manually in MongoDB):
   ```javascript
   // In MongoDB Compass or shell:
   db.users.updateOne(
     { email: "your@email.com" },
     { $set: { subscriptionStatus: "pro" } }
   )
   ```

2. **Refresh dashboard**
3. **Click robot**: Open chat
4. **Send 5+ messages**: All should get real AI responses
5. **Check console**: No throttle messages
   ```
   💬 Pro user abc123 chat message: "..."
   ✅ Chat response generated for Pro user
   ```

**Expected**: Unlimited AI chat, no upgrade prompts.

---

## Test 4: PayU Payment Flow (5 minutes)

### Setup:
⚠️ **Note**: PayU will reject payment in dev mode without real merchant account. This tests the flow only.

1. **Go to Pricing**: http://localhost:5173/pricing
2. **Toggle Annual/Monthly**: Prices update
3. **ROI Calculator**: Change monthly waste amount, see ROI update
4. **Click "Upgrade to Pro"**:
   - Confetti appears ✨
   - Toast: "Redirecting to payment gateway..."
   - Button shows "Redirecting..."

5. **Check DevTools Network**:
   - POST to `/api/payment/create-session`
   - Response contains PayU form data

6. **Check Console**:
   ```
   💳 PayU session created for user abc123
      Amount: ₹7999, Plan: annual, TxnID: SUBTRACK_...
   ```

7. **Auto-redirect**: Browser submits hidden form to PayU
   - Will fail in dev (expected)
   - In production with real keys, redirects to PayU

**Expected**: Smooth flow up to PayU redirect.

---

## Test 5: Payment Success Page (1 minute)

1. **Manually navigate**: http://localhost:5173/payment/success?status=success&txnid=TEST123
2. **Should see**:
   - Confetti 🎊
   - "Welcome to Pro!" message
   - List of Pro features
   - "Go to Dashboard" button

**Expected**: Beautiful success page.

---

## Test 6: Payment Failure Page (1 minute)

1. **Navigate**: http://localhost:5173/payment/failure
2. **Should see**:
   - Red error icon
   - "Payment Failed" message
   - Reasons for failure
   - "Try Again" button

**Expected**: Clear error page.

---

## Test 7: MongoDB Cache (2 minutes)

1. **Open MongoDB Compass**
2. **Find collection**: `robotchatcaches`
3. **Check document**:
   ```javascript
   {
     userId: ObjectId("..."),
     lastMessage: "Found 3 leaks worth ₹47k",
     timestamp: ISODate("2025-11-22T00:45:00Z"),
     isPro: false,
     messageCount: 1,
     lastResetAt: ISODate("2025-11-22T00:45:00Z")
   }
   ```

**Expected**: Cache document created after first robot interaction.

---

## Test 8: Gemini Fallback (1 minute)

1. **Temporarily break Gemini**:
   - In `backend/.env`, set `GEMINI_API_KEY=invalid_key`
   - Restart backend

2. **Refresh dashboard**
3. **Check robot speech**: Should show funny fallback message:
   - "I'm your money-saving sidekick! Click me to chat 💬"
   - "Pro tip: I get smarter when you upgrade 😏"
   - etc.

4. **Check console**:
   ```
   ❌ Robot speech generation failed: ...
   ```

5. **Restore API key**, restart backend

**Expected**: Graceful fallback, no crashes.

---

## Test 9: Savage Mode (Pro Users) (2 minutes)

1. **Ensure you're Pro** (from Test 3)
2. **Refresh dashboard**
3. **Check robot speech**: Should be more "savage":
   - "Pro users auto-fix this while sleeping 😏"
   - "You're crushing it with 8 healthy services"
   - etc.

4. **Check console**:
   ```
   🤖 Generating NEW robot speech for user abc123 (isPro: true)
   ```

**Expected**: Different tone for Pro users.

---

## Test 10: End-to-End Conversion Flow (5 minutes)

1. **Start as Free User**:
   - Set `subscriptionStatus: 'free'` in MongoDB
   - Refresh dashboard

2. **See robot**: "Found 3 leaks worth ₹47k"
3. **Click robot**: Open chat
4. **Ask question**: Get helpful answer
5. **Ask again**: See upgrade prompt
6. **Click "Upgrade to Pro"**: Go to pricing
7. **See ROI**: "Pro pays for itself in 10 minutes"
8. **Click "Upgrade"**: Confetti + redirect
9. **(Simulate payment success)**:
   - Manually set `subscriptionStatus: 'pro'`
   - Navigate to `/payment/success`

10. **Click "Go to Dashboard"**
11. **Click robot**: Unlimited chat now available

**Expected**: Smooth free → pro journey.

---

## 🐛 Common Issues

### Robot not appearing:
- Check `RobotAssistant` is imported in `Dashboard.tsx`
- Check no CSS hiding it (`.no-print` class)

### Speech not loading:
- Check Gemini API key
- Check backend logs for errors
- Check network tab for `/api/robot/speech` call

### Chat not working:
- Check MongoDB connection
- Check `robotchatcaches` collection exists
- Check user is authenticated

### PayU redirect failing:
- Expected in dev mode
- Check PayU credentials in `.env`
- Check `CLIENT_URL` is correct

---

## ✅ Success Criteria

- [ ] Robot appears on dashboard
- [ ] Speech bubble shows dynamic AI message
- [ ] Cache works (same message within 5 min)
- [ ] Free user gets 1 chat message, then upgrade prompt
- [ ] Pro user gets unlimited chat
- [ ] Pricing page shows PayU integration
- [ ] Payment success/failure pages work
- [ ] MongoDB cache created correctly
- [ ] Fallback messages work when Gemini fails
- [ ] Console logs all AI calls

---

**Total testing time: ~20 minutes**

**If all tests pass, you're ready to launch! 🚀**
