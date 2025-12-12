# How to Run the Seed Script

Since PowerShell execution policy is blocking npm, use one of these methods:

## Option 1: Use Command Prompt (cmd)
1. Open Command Prompt (not PowerShell)
2. Navigate to backend: `cd D:\matrimonial\backend`
3. Run: `npm run seed`

## Option 2: Use Node directly
```bash
cd D:\matrimonial\backend
node -r ts-node/register prisma/seed.ts
```

## Option 3: Fix PowerShell execution policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm run seed
```

## Option 4: Use Git Bash or WSL
If you have Git Bash or WSL installed, use that terminal instead.

