# RMoney

## Current State
Blank backend (actor {}) and no App.tsx. Previous build failed.

## Requested Changes (Diff)

### Add
- Admin portal: login with mobile 9053405019 / password Rakhi5050, forgot password via OTP
- Admin: wallet management (add money via multiple methods, send via UPI to users)
- Admin: task management (add/edit tasks with URL, link, APK image, sequence 1-4 scrollable horizontally)
- Admin: live task tracking per user
- Admin: withdrawal approval popup (shows user UPI + user ID, deducts from admin wallet on approval)
- Admin: referral withdrawal section (separate from task withdrawals)
- Admin: UPI ID setting field
- User portal: portrait-mode mobile UI
- User: phone number + OTP login, Google login option
- User: profile page with name, user ID, profile photo upload/update
- User: wallet with UPI ID field
- User: tasks in horizontal scrolling sequence (1, 2, 3, 4...)
- User: referral system (earn 500 coins per referral, 1000 coins = 10 Rs)
- User: withdrawal (UPI ID input, 10/day limit, min 1000 coins task withdrawal)
- User: referral coin withdrawal separately (min 1000 coins)
- User: withdrawal sends request to admin with user UPI + user ID
- RM logo (realistic)

### Modify
- Backend: replace empty actor with full RMoney logic

### Remove
- Nothing

## Implementation Plan
1. Select authorization and blob-storage components
2. Generate Motoko backend: users, admin, tasks, wallet, withdrawals, referrals, profile photo storage
3. Build React frontend:
   - Route: /admin (admin portal, protected)
   - Route: / (user portal, portrait mobile)
   - Admin sections: Dashboard, Tasks, Wallet, Withdrawals, Referral Withdrawals, Settings
   - User sections: Login, Profile (with photo upload), Tasks, Wallet, Referral, Withdraw
4. Wire blob-storage for profile photo uploads
5. Deploy
