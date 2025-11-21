# 🔑 How to Get Real API Tokens (Testing Guide)

## 🚨 Current Situation

Your backend is **ready for real APIs**, but the frontend is storing **mock tokens** (`mock-oauth-token-123`).

**What happened**:
```
Frontend: Stores "mock-oauth-token-123"
Backend: Decrypts mock token
API Call: fetch('https://api.github.com/user', { headers: { Authorization: 'token mock-oauth-token-123' }})
GitHub API: Returns {} (unauthorized)
Result: Empty data
```

**Solution**: Use **real OAuth tokens** for testing.

---

## 🎯 Quick Start: Get Real Tokens

### **Option 1: GitHub Personal Access Token** (Recommended for Testing)

#### **Step 1: Generate Token**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "SubTrack Testing"
4. Select scopes:
   - ✅ `read:user` (Read user profile)
   - ✅ `repo` (Read repositories - needed for commit data)
5. Click "Generate token"
6. **COPY THE TOKEN** (starts with `ghp_...`)
   - ⚠️ You can only see it once!

#### **Step 2: Use in SubTrack**
1. Open SubTrack: `http://localhost:5173`
2. Click "Connect GitHub"
3. Paste your token (e.g., `ghp_abc123xyz...`)
4. Click "Connect GitHub with Real Token"

#### **Step 3: Scan**
1. Click "Scan Now"
2. Check backend console - you'll see:
   ```
   🔑 Token decrypted successfully (first 10 chars): ghp_abc123...
   ✅ GitHub API Response (/user): {
     "login": "your-username",
     "plan": { "name": "free" },
     "total_private_repos": 0,
     "public_repos": 42
   }
   🎯 REAL DATA FROM GITHUB API: { plan: 'free', ... }
   ```

---

### **Option 2: Vercel Access Token**

#### **Step 1: Generate Token**
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: "SubTrack Testing"
4. Scope: "Full Account"
5. Click "Create"
6. **COPY THE TOKEN**

#### **Step 2: Use in SubTrack**
1. Click "Connect Vercel"
2. Paste your Vercel token
3. Click "Connect Vercel with Real Token"

#### **Step 3: Scan**
Backend will show:
```
✅ Vercel API Response (/v2/user): {
  "username": "your-username",
  "tier": "hobby",
  "email": "your@email.com"
}
```

---

### **Option 3: Sentry Auth Token**

#### **Step 1: Generate Token**
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Name: "SubTrack Testing"
4. Scopes:
   - ✅ `org:read`
   - ✅ `project:read`
5. Click "Create Token"
6. **COPY THE TOKEN**

#### **Step 2: Use SubTrack**
1. Connect Sentry
2. Paste token
3. Scan

---

## 🔒 Security: Are Tokens Safe?

**YES!** Here's how they're protected:

### **Encryption Flow**:
```
1. You enter: ghp_abc123xyz789...
2. Frontend sends to backend
3. Backend encrypts with AES-256 (using ENCRYPTION_KEY from .env)
4. Stored in MongoDB: "U2FsdGVkX1+abc123encrypted..."
5. On scan: Decrypt → Use → Delete from memory
6. Never sent to frontend again
```

**Security Measures**:
- ✅ AES-256 encryption
- ✅ Tokens never in frontend after initial connection
- ✅ Read-only permissions (can't delete repos, etc.)
- ✅ You can revoke tokens anytime from GitHub/Vercel

---

## 📊 What You'll See with Real Tokens

### **GitHub (Free Plan)**:
```bash
🔍 ==> GITHUB API CALL STARTING...
📍 Endpoint: https://api.github.com/user
🔑 Token decrypted successfully (first 10 chars): ghp_abc123...
📡 Calling GitHub API: /user...
✅ GitHub API Response (/user): {
  "login": "rahulsinghpilani7",
  "id": 12345,
  "avatar_url": "https://...",
  "name": "Rahul Singh",
  "plan": {
    "name": "free",
    "space": 976562499,
    "collaborators": 0,
    "private_repos": 0
  },
  "total_private_repos": 0,
  "public_repos": 45,
  "created_at": "2020-01-15T..."
}
📡 Calling GitHub API: /user/repos...
✅ GitHub API Response (/repos): {
  "repo_count": 1,
  "most_recent": "SaaSSaver",
  "pushed_at": "2025-01-21T01:30:00Z"
}
🎯 REAL DATA FROM GITHUB API: {
  plan: 'free',
  lastCommitDate: '2025-01-21T01:30:00.000Z',
  hasPrivateRepos: false
}
✅ Using REAL API data (not mock)
```

**Result in Dashboard**: 
- ✅ "No leaks found" (because you're on FREE plan)
- ✅ Honest, accurate, professional

### **GitHub (Pro Plan - Unused)**:
```bash
✅ GitHub API Response: {
  "plan": { "name": "pro" },
  "total_private_repos": 2
}
✅ Last commit: 95 days ago

🎯 REAL DATA: { plan: 'pro', daysSinceCommit: 95 }
```

**Result**:
- ⚠️ "GitHub Pro — Save ₹340/month"
- 💡 AI Roast: "Bro, you haven't touched GitHub in 95 days. That's ₹340 burning every month!"

---

## 🧪 Testing Checklist

### **Test 1: GitHub (Free Plan)**
- [ ] Get GitHub Personal Access Token
- [ ] Connect in SubTrack
- [ ] Click "Scan Now"
- [ ] Check backend console for real API responses
- [ ] Verify: "No leaks found" (correct for free plan)

### **Test 2: Vercel (Hobby)**
- [ ] Get Vercel token
- [ ] Connect in SubTrack
- [ ] Scan
- [ ] Check console for real tier data
- [ ] Verify: No findings (already on free tier)

### **Test 3: Error Handling**
- [ ] Connect with invalid token
- [ ] Should see fallback message
- [ ] App doesn't crash

---

## 🚀 Production OAuth (Future)

For **real production** with automatic OAuth:

### **GitHub OAuth App Setup**:
1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Callback URL: `https://yourapp.com/api/auth/github/callback`
4. Get Client ID + Secret
5. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=abc123
   GITHUB_CLIENT_SECRET=secret456
   ```

### **OAuth Flow**:
```
1. User clicks "Connect GitHub"
2. Redirect to: https://github.com/login/oauth/authorize?client_id=...
3. User authorizes
4. GitHub redirects back with code
5. Exchange code for token
6. Encrypt + store token
7. Done!
```

**Timeline**: 2-4 hours to implement full OAuth for all services.

---

## ✅ Summary

**Current State**:
- ❌ Mock tokens don't work with real APIs
- ✅ **Fix**: Use real tokens manually

**How to Test Now**:
1. Get GitHub token from https://github.com/settings/tokens
2. Copy token (starts with `ghp_...`)
3. Open SubTrack → Connect GitHub
4. Paste token
5. Click "Scan Now"
6. **See REAL API responses in console!** 🎉

**Future**:
- Full OAuth flow (automatic)
- No manual token entry needed
- One-click connections

**Security**: 
- ✅ Tokens encrypted with AES-256
- ✅ Read-only access
- ✅ Revocable anytime

---

## 🎯 Next Steps

1. **Get a GitHub token** right now:
   - https://github.com/settings/tokens
   - Scopes: `read:user`, `repo`

2. **Test in SubTrack**:
   - Refresh app
   - Click "Connect GitHub"
   - Paste your real token
   - Scan

3. **Check console**:
   - Should see your actual username
   - Real plan: "free"
   - Actual commit dates
   - **PROOF it's calling real APIs!**

**Ready to test? Get your GitHub token now!** 🚀
