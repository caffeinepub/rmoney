# RMoney

## Current State
Two-portal app (Admin /admin, User /). Data via localStorage.

## Requested Changes (Diff)

### Add
- TaskCompletion: adminConfirmed + adminConfirmedAt fields
- Admin Dashboard: Confirm button per completion + 3s auto-refresh
- Admin Add Money: UPI payment app buttons (GPay, Paytm, PhonePe)
- Admin Forgot Password: show OTP in green box on screen
- Admin Withdrawal: user profile photo in pending rows
- User Tasks: Admin Verified badge on confirmed completions

### Modify
- types.ts, AdminPortal, UserPortal

### Remove
- Nothing

## Implementation Plan
1. types.ts: add adminConfirmed/adminConfirmedAt to TaskCompletion
2. Admin DashboardTab: 3s refresh + Confirm button
3. Admin WalletTab: GPay/Paytm/PhonePe buttons when UPI selected
4. Admin Login: OTP green box display
5. Admin WithdrawalTab: Avatar with profile photo
6. User TasksTab: green Admin Verified badge
