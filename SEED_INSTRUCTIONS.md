# Database Seeding Instructions

## How to Run the Seed Script

The seed script will create dummy data for all tables including:
- 4 test user accounts (2 male, 2 female)
- Complete profiles for all users
- Photos, subscriptions, payments, add-ons
- Interests, chats, messages
- Shortlists, blocked users, profile views
- Horoscopes, success stories, family members
- Referrals, achievements, documents
- Video calls, profile comparisons, notifications
- Forum posts, community groups, events, blog posts

## Test Accounts Created

After running the seed script, you can login with:

### User 1 (Male - John Doe)
- **Email:** john.doe@example.com
- **Mobile:** +919876543210
- **Password:** password123

### User 2 (Female - Jane Smith)
- **Email:** jane.smith@example.com
- **Mobile:** +919876543211
- **Password:** password123

### User 3 (Female - Alice Johnson)
- **Email:** alice.johnson@example.com
- **Mobile:** +919876543212
- **Password:** password123

### User 4 (Male - Bob Williams)
- **Email:** bob.williams@example.com
- **Mobile:** +919876543213
- **Password:** password123

## Running the Seed Script

### Option 1: Using npm (if PowerShell allows)
```bash
cd backend
npm run seed
```

### Option 2: Using npx directly
```bash
cd backend
npx ts-node prisma/seed.ts
```

### Option 3: Using Node directly
```bash
cd backend
node -r ts-node/register prisma/seed.ts
```

### Option 4: If PowerShell execution policy blocks scripts
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Then run: `npm run seed`

### Option 5: Use Command Prompt (cmd) instead
1. Open Command Prompt (cmd)
2. Navigate to backend folder: `cd D:\matrimonial\backend`
3. Run: `npm run seed`

## What Gets Created

- ✅ 4 Users with complete profiles
- ✅ 6 Photos across profiles
- ✅ 2 Active Premium Subscriptions
- ✅ 2 Completed Payments
- ✅ 2 Active Add-ons (Profile Boost, Verified Badge)
- ✅ 4 Interests (2 accepted, 2 pending)
- ✅ 2 Chats with messages
- ✅ 3 Shortlist entries
- ✅ 1 Blocked user
- ✅ 4 Profile views
- ✅ 2 Horoscopes with 1 match
- ✅ 1 Success story (approved & featured)
- ✅ 2 Family members
- ✅ 1 Referral (completed)
- ✅ 3 Achievements
- ✅ 2 Documents
- ✅ 1 Video call
- ✅ 2 Profile comparisons
- ✅ 3 Notifications
- ✅ 1 Forum post with comment
- ✅ 1 Community group with 2 members
- ✅ 1 Community event
- ✅ 1 Blog post

## Notes

- The seed script will **delete all existing data** before creating new data
- All users have verified email and mobile
- User 1 and User 2 have active Premium subscriptions
- User 1 and User 2 have mutual interests (both accepted)
- User 1 has shortlisted User 2 and User 3
- User 1 has blocked User 4
- All profiles are in ACTIVE status

