# StockFlow — Deploy Instructions

## 1. Install dependencies & build
```bash
npm install
npm run build
```

## 2. Deploy to Vercel (easiest)
```bash
npm install -g vercel
vercel login
vercel --prod
```
Choose your team "Dharmie's projects" when prompted.

## 3. Or drag-and-drop the `dist/` folder to https://vercel.com/new

That's it! The app is connected to Supabase already.
