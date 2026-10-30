# ProteinCart

**Eat for your gym goal. Spend less than a burrito bowl a day.**

### [▶ Open the live demo](https://zhizheng28.github.io/protein-cart/)

| | |
|---|---|
| Landing page | **https://zhizheng28.github.io/protein-cart/** |
| Jump straight into the app | **https://zhizheng28.github.io/protein-cart/app/** |

Works on phones (iPhone and Android) and laptops. No sign-up, nothing to install.

ProteinCart builds a weekly high-protein meal plan for students who work out, turns it into a grocery
cart with Kroger prices, and shows what you save versus buying takeout. Savings fill a progress bar
toward something fun, like a game ticket. No food logging, no calorie counting.

Built by Team 17 for the Michigan Business+Tech Innovation Jam, Fall 2026.

## What it does
1. **Five questions:** weight, gym goal, weekly budget, store, and what you're saving up for.
2. **A week of meals:** 7 breakfasts and 14 lunches/dinners that hit a rough protein target at the
   lowest grocery cost. Every week mixes chicken, beef and seafood (at least two of each, from at least
   two different dishes), and lunch and dinner on the same day use different proteins.
3. **One grocery cart:** whole packages, sorted by aisle, with the total versus 14 takeout bowls
   ($13.50 each).
4. **"I didn't plan" button:** a 10-minute meal from what's already in the cart, and what it saves.

Protein targets (grams a day): build muscle 0.7 × body weight in lb, lean out 0.75 ×, stay healthy
0.55 ×, rounded to the nearest 10.

## How it's built
- **Backend:** Python 3.12, FastAPI, PuLP (integer programming). `backend/app/optimizer.py` chooses the
  meals and buys whole packages at the lowest cart total; `matching.py` turns a plan into a cart;
  `savings.py` holds the takeout baseline and money math (all money in integer cents).
- **Frontend:** React, TypeScript, Vite, Tailwind. Mobile-first, light and dark mode.
- **Data:** 19 meals and 30 ingredients in `backend/data/`, with sample Ann Arbor Kroger prices
  (Oct 28, 2026). Live Kroger API prices are planned.
- **Public demo:** a static build on GitHub Pages. The optimizer's plans are computed ahead of time for
  every protein target, and a test checks that the browser's cart math matches the Python code.

```
backend/
  app/          FastAPI app: optimizer, matching, savings, routers
  data/         meals.json, ingredients.json, sample_prices.json
  scripts/      export_demo_data.py (pre-solves plans for the static demo)
  tests/        pytest
frontend/
  index.html    landing page
  app/          the app
  src/screens/  Onboarding, Money, Plan, Cart, Goals, QuickMealSheet
  src/demo/     in-browser engine for the static demo
docs/           prototype and screenshots of every screen
```

## Run locally
```bash
cd frontend && npm install && npm run build && cd ..
cd backend && python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DEMO_MODE=true uvicorn app.main:app --reload
```
Open http://localhost:8000.

To preview the static demo instead:
```bash
cd frontend && npm run build:static && npx vite preview --mode static
```

## Deploying
Every push to `main` runs the tests and publishes the site to GitHub Pages
(`.github/workflows/pages.yml`). After changing meals, prices or the optimizer, regenerate the demo data
and commit it:
```bash
cd backend && .venv/bin/python scripts/export_demo_data.py
```

## Tests
```bash
cd backend && pytest
cd frontend && npm test     # browser math must match the Python backend
```
