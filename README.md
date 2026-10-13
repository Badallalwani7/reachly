# Reachly

**Know your reach. Know your worth.**

Live demo: https://badallalwani7.github.io/reachly/

Creators sign in with Google, add their social platforms, and get:

- **Live counters**: total audience, views today, and views since the page opened. The digits roll like a live subscriber counter.
- **Reach**: daily, monthly and projected yearly reach across Instagram, YouTube, TikTok, X, LinkedIn, Facebook, Threads, Snapchat and Twitch.
- **Audience quality grade**: engagement, view-through, comment depth, growth health and geography, with an estimated authentic audience and tips.
- **Brand rate card**: price ranges per deliverable, plus single-post, monthly and annual-ambassador packages and an earnings estimator. Supports USD, INR (lakh/crore), EUR, GBP, AED, CAD and AUD.
- **Charts**: a 12-month audience and reach projection (hover for values) and an audience split by platform.
- **The number game**: stadiums filled, ad-spend equivalent, attention time, and a next-milestone ETA.
- **Copy media kit**: a plain-text summary of your stats and rates to paste into brand emails.

## Enable real Google Sign-In

Until a Client ID is set, the site runs in demo mode.

1. Open https://console.cloud.google.com/apis/credentials, then **Create credentials → OAuth client ID → Web application**. You may need to set up the OAuth consent screen first.
2. Under **Authorized JavaScript origins**, add:
   - `https://badallalwani7.github.io`
   - `http://localhost:5173` (for local development)
3. Paste the Client ID into `config.js` and push. A Client ID is public by design, so it is safe to commit.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Landing, onboarding and dashboard views |
| `app.js` | Auth, benchmarks, scoring model, odometer, charts, media kit |
| `styles.css` | Styles |
| `icons.js` | Platform logos (Simple Icons, CC0) |
| `config.js` | Google Client ID |

## How the numbers work

- **Reach** = avg views × posts per month, summed across platforms. Yearly reach compounds each platform's monthly growth.
- **Quality (0–100)** = engagement vs platform benchmark (30%), view-through (25%), comments-to-likes depth (15%), growth health (15%, spikes are penalised) and Tier-1 geography (15%).
- **Rate** = `avg views / 1000 × platform CPM × niche multiplier × geo multiplier × quality multiplier` × a deliverable multiplier, shown as a floor → ask range.

All benchmarks are at the top of `app.js` if you want to tune them.

## Roadmap

- Verify the Google ID token on a backend and store profiles in a database. Today, data lives in `localStorage` per Google account.
- Pull stats automatically through the Instagram Graph, YouTube Data and TikTok APIs. Each needs per-platform OAuth and app review.
