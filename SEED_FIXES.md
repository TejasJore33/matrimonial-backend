# Seed Script - Important Notes

## Before Running the Seed Script

**You MUST regenerate the Prisma client first** because the schema has been updated but the client hasn't been regenerated:

```bash
cd backend
npx prisma generate
```

## Then Run the Seed

After regenerating Prisma client, run:

```bash
npm run seed
```

Or if PowerShell blocks npm:

```bash
node -r ts-node/register prisma/seed.ts
```

## What the Seed Creates

- 4 test user accounts (2 male, 2 female)
- Complete profiles for all users
- Photos, subscriptions, payments, add-ons
- Interests, chats, messages
- Shortlists, blocked users, profile views
- Horoscopes, success stories, family members
- Referrals, achievements, documents
- Video calls, profile comparisons, notifications
- Forum posts, community groups, events, blog posts

## Test Accounts

1. **john.doe@example.com** / password123 (Male)
2. **jane.smith@example.com** / password123 (Female)
3. **alice.johnson@example.com** / password123 (Female)
4. **bob.williams@example.com** / password123 (Male)

