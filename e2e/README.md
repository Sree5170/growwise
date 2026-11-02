# Optional browser smoke test

Drives the real UI (headless Chromium) against the real API and database: register → add child → assign → child mode → submit → approve → library filters → three games → safety lesson → progress charts → settings → responsive overflow checks at 375/768/1280 px → axe-core WCAG 2 A/AA scan → account deletion. It creates one throw-away account (deleted at the end) and saves screenshots to `e2e/shots/`.

```bash
# terminal 1: MongoDB running, seeded (npm run seed), API on :5000
# terminal 2: npm run dev:client   (http://localhost:5173)
cd e2e && npm install && npm run e2e
```
Notes: needs the seeded activities and lessons. It uses `@sparticuz/chromium` (a bundled headless Chromium), so no browser install is required. Web fonts from Google may fail to load offline; that is expected and harmless. Set `E2E_BASE_URL` to test another host.
