# ProteinCart

Eat for your gym goal and spend less than a burrito bowl a day.

ProteinCart builds a weekly high-protein meal plan for students, turns it into a grocery cart with live
Kroger prices, and shows what you save versus takeout. Savings fill a progress bar toward something fun,
like a game ticket.

Built by Team 17 for the Michigan Business+Tech Innovation Jam, Fall 2026.

## Stack
- Backend: Python 3.12, FastAPI, SQLModel (SQLite), PuLP, httpx
- Frontend: React, Vite, TypeScript, Tailwind
- Data: Kroger developer API, with sample-price fallback
- Hosting: Render (one web service)

## Run locally
```bash
cp .env.example .env            # add your Kroger keys
cd frontend && npm install && npm run build && cd ..
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open http://localhost:8000. Set `DEMO_MODE=true` in `.env` to run without Kroger keys.

## Public demo (GitHub Pages)
The landing page and a demo of the app that runs entirely in the browser are published to GitHub Pages on
every push to `main` (`.github/workflows/pages.yml`). To preview it locally:
```bash
cd frontend && npm run build:static && npx vite preview --mode static
```
After changing meals, prices or the optimizer, regenerate the demo data and commit it:
```bash
cd backend && .venv/bin/python scripts/export_demo_data.py
```

## Tests
```bash
cd backend && pytest
cd frontend && npm test     # browser math must match the Python backend
```

