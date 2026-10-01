# TrailGurus

A CarGurus-style marketplace for powersports — ATVs, side-by-sides, snowmobiles and motorcycles — that also covers research: owner reviews you can filter, common problems by make and model, and every current brand discount.

## What's in it

| Page | What it does |
| --- | --- |
| `/` | Search hero, categories, today's best deals, current brand discounts, top-rated models |
| `/listings` | Search with filters: type, deal rating, make, model, new/used, price, year, hours/miles, distance, seller type. Every listing gets a **Great / Good / Fair / High / Overpriced** rating |
| `/listings/[id]` | Price-vs-market analysis and meter, specs, price history, **known issues flagged for that model year**, owner rating, brand offers that may apply, similar listings |
| `/research` | Compare models by owner rating, reliability, value, fewest serious issues, MSRP |
| `/research/[slug]` | Full model report: sub-ratings, new/used prices, current offers, common problems, filterable reviews |
| `/reviews` | All owner reviews. Filter by riding style (mud, dunes, trail, mountain…), rider experience, model year, minimum stars, verified owners, and "only reviews that mention problems". You can also sort by what matters most to you (e.g. best reliability first) |
| `/issues` | Searchable common-problems database: symptoms, usual fix, typical cost, how much it's discussed, sources, recalls vs. bulletins vs. owner reports. Filter by model year |
| `/deals` | Rebates, promo APR, and pro/industry, military, first-responder, farm & ag, loyalty and racer programs, filtered by "I am…" |

Filters apply instantly as you change them, the URLs can be shared, and everything still works with JavaScript turned off.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

Stack: Next.js 16 (App Router, server components), React 19, Tailwind CSS 4, TypeScript. No database yet.

## Data — important

This is a **working prototype on sample data**:

- `src/data/catalog.ts` — 30 real models with approximate MSRPs and specs.
- `src/data/issues.ts` — common problems written as recurring owner-discussion themes. Mention counts are illustrative, and there are no thread links.
- `src/data/promos.ts` — offers are **illustrative**. "Verify" links go to each brand's site.
- Listings (`src/lib/listings.ts`) and reviews (`src/lib/reviews.ts`) are **generated** with a seeded random generator, so they stay the same between runs.

The market-value model (`estimateMarketValue`) uses MSRP, a depreciation rate for each model, age, and hours/miles compared with typical use. Deal ratings compare the asking price to that estimate.

## Going to production — next steps

1. **Real listings:** dealer inventory feeds (DMS exports or partners such as Dealer Spike/ARI), plus private-seller posting with accounts.
2. **Market value:** train it on real sold and listed prices (and NADA/JD Power powersports values if licensed) instead of the formula.
3. **Common issues:** collect Reddit posts through the official Reddit API (respect its terms and rate limits) and forums where permitted. Group them into themes with an LLM, link to the original sources, and have a person review them. Pull recalls from NHTSA (motorcycles) and CPSC (off-road vehicles).
4. **Reviews:** user accounts, VIN or receipt check for the "verified owner" badge, and moderation.
5. **Deals:** track each brand's offers page, using partnerships or scheduled scrapes with human review. Store the date each offer was last checked and show it.
6. Add a database (Postgres + Prisma), saved searches and price-drop alerts, and side-by-side model comparison.
