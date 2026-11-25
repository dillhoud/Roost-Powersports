# Roost

A CarGurus-style marketplace for powersports in **Canada** — ATVs, side-by-sides, snowmobiles and motorcycles — that also covers research: owner reviews you can filter, common problems by make and model, and every current brand discount.

## Canada only

Roost covers Canada only:

- All prices are in **Canadian dollars**, including MSRPs, listings, values and offers.
- Listings are in Canadian cities, shown by province or territory. Distances and odometers are in **kilometres**.
- The payment calculator starts with each province's sales tax (GST, PST, QST, RST or HST) and Canadian freight and PDI charges.
- Offers link to the brands' Canadian sites and use Canadian eligibility (Canadian Armed Forces, paramedics, registered farms).
- Recalls refer to **Transport Canada**.

## What's in it

| Page | What it does |
| --- | --- |
| `/` | Search hero, categories, today's best deals, current brand discounts, top-rated models |
| `/listings` | Search with filters: type, deal rating, make, model, new/used, price, year, hours/km, distance in km, seller type, **time on market** and **price drops only**. Sort by biggest price drop or longest listed. Every listing gets a **Great / Good / Fair / High / Overpriced** rating, an estimated monthly payment, and "Just listed" / "make an offer" badges |
| `/listings/[id]` | Price-vs-market analysis and meter, specs, **time on market compared with similar listings** and price history, **payment calculator** (down payment, term, credit, provincial sales tax, freight and PDI, and the brand's promo APR on new dealer units), **known issues flagged for that model year**, owner rating, brand offers that may apply, similar listings |
| `/value` | **What's my machine worth?** Trade-in, private-party and dealer retail estimates for any model, year and hours/km; how use changes the value; expected value a year out; known issues buyers will ask about; similar listings; and an optional "is this price fair?" check |
| `/research` | Compare models by owner rating, reliability, value, fewest serious issues, MSRP |
| `/compare` | **Side-by-side comparison** of up to 3 models: Canadian MSRP, estimated payment, owner ratings, reliability, serious known issues, value lost per year and after 3 years, horsepower, current offers and listings. The best in each row is highlighted, and the link can be shared. Tick **Compare** on up to 3 models (research cards, model pages, listings) and a bar at the bottom of the screen collects them, with a **Compare now** button. Picks are remembered in that browser. Also linked as "Compare with rivals" |
| `/research/[slug]` | Full model report: sub-ratings, new/used prices, current offers, common problems, filterable reviews |
| `/reviews` | All owner reviews. Filter by riding style (mud, dunes, trail, mountain…), rider experience, model year, minimum stars, verified owners, and "only reviews that mention problems". You can also sort by what matters most to you (e.g. best reliability first) |
| `/issues` | **Buyer's checklist** (named "Known issues" before): a searchable database of what to check on each model: symptoms, usual fix, typical cost, how much it's discussed, sources, recalls vs. bulletins vs. owner reports. Filter by model year |
| `/deals` | Rebates, promo APR, and pro/industry, military, first-responder, farm & ag, loyalty and racer programs, filtered by "I am…" |

Filters apply instantly as you change them, the URLs can be shared, and everything still works with JavaScript turned off.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

Stack: Next.js 16 (App Router, server components), React 19, Tailwind CSS 4, TypeScript, Prisma + Postgres.

## Admin (`/admin`)

A password-protected area for managing **known issues** and **deals** without touching code:

- Add, edit, delete, publish or unpublish issues and offers
- Source links on issues (shown publicly so riders can read the original threads)
- "Mark checked" with a last-checked date, plus an overview of what's ending soon or hasn't been checked in 30 days
- Changes show on the public site immediately
- **Offer pages:** add each brand's Canadian offers page. The site checks them every morning (Vercel Cron, `vercel.json`) and flags any page whose offer text changed, showing the lines that were added or removed. Update your deals, then click **Mark reviewed**. A page that blocks automated visits, loads its offers with JavaScript, or has moved is flagged so you check it by hand.

### Setting it up on Vercel

1. **Password:** Project → Settings → Environment Variables → add `ADMIN_PASSWORD`.
2. **Database:** Project → Storage → Create Database → **Neon (Postgres)** → free plan → connect to this project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. **Redeploy.** The build creates the tables automatically.
4. Visit `/admin`, log in, and click **Load starter content** to copy the current sample issues and deals into the database.
5. Optional: add `CRON_SECRET` (any long random text) so only Vercel's scheduler can trigger the daily offer-page check. Without it, the check only accepts Vercel's scheduler and skips pages checked in the last 6 hours.

Until a database is connected, the public site runs on the bundled sample data and the admin shows these steps.

### Local development

```bash
cp .env.example .env      # point DATABASE_URL at a local Postgres
npx prisma migrate dev    # create tables
npm run db:seed           # optional: load starter content
npm run dev
```

## Data — important

This is a **working prototype on sample data**:

- `src/data/catalog.ts` — 30 real models with approximate Canadian MSRPs (CAD) and specs. The MSRPs are estimates, so check them against each brand's Canadian price list.
- `src/data/issues.ts` — common problems written as recurring owner-discussion themes. Mention counts are illustrative, and there are no thread links.
- `src/data/promos.ts` — offers are **illustrative**. "Verify" links go to each brand's site.
- Listings (`src/lib/listings.ts`) and reviews (`src/lib/reviews.ts`) are **generated** with a seeded random generator, so they stay the same between runs.

The market-value model (`estimateMarketValue`) uses MSRP, a depreciation rate for each model, age, and hours/km compared with typical use. Deal ratings compare the asking price to that estimate.

## Going to production — next steps

1. **Real listings:** dealer inventory feeds (DMS exports or partners such as Dealer Spike/ARI), plus private-seller posting with accounts.
2. **Market value:** train it on real sold and listed prices (and Canadian Black Book powersports values if licensed) instead of the formula.
3. **Common issues:** collect Reddit posts through the official Reddit API (respect its terms and rate limits) and forums where permitted. Group them into themes with an LLM, link to the original sources, and have a person review them. Pull recalls from Transport Canada's motor vehicle recalls database.
4. **Reviews:** user accounts, VIN or receipt check for the "verified owner" badge, and moderation.
5. **Deals:** track each brand's Canadian offers page, using partnerships or scheduled scrapes with human review. Store the date each offer was last checked and show it.
6. Add a database (Postgres + Prisma), saved searches and price-drop alerts, and side-by-side model comparison.
