# College demonstration checklist (≈10 minutes)

## Before the demo (do this the day before)
- [ ] MongoDB is running (local or Atlas) and `server/.env` is filled in
- [ ] `npm run seed -- --reset --demo` — loads content, two fictional accounts and demo history for the child "Mia"
- [ ] Note the demo password (printed, or `SEED_DEMO_PASSWORD` in `server/.env`)
- [ ] Start both servers, open the app once, log in/out once to confirm everything works
- [ ] Have a second browser window ready for child mode if you want to show both sides
- [ ] Charge the laptop; check projector resolution; zoom the browser to 110%
- [ ] Have `docs/api-requests.http` or Postman ready for the security demo
- [ ] Know the two weak spots to mention honestly: no email reminders, content not expert-certified (see README "Limitations")

## Suggested flow
1. **Problem and idea (1 min)** — landing page; "reduce recreational screen time, build routines, safety skills".
2. **Parent dashboard (1 min)** — log in as `demo.parent@growwise.test`; point out real data, not hard-coded.
3. **Assign a mission (1 min)** — Assign → search → pick → date → note. Show age filter in the picker.
4. **Child mode (2 min)** — *Open child mode*; show level path, mission details, submit with a note. Show that the *Grown-ups* gate needs the parent password.
5. **Verification and rewards (1 min)** — approve as parent: points and badge toast. Try approving again → refused (no duplicate points).
6. **Brain games (1 min)** — Memory Match + one quiz with hint and explanation.
7. **Safety Academy (1 min)** — a lesson, quiz, printable checklist, "not a live alert" notice.
8. **Progress and recommendations (1 min)** — charts from the database; recommendation reasons.
9. **Security proof (1 min)** — in Postman/REST client: call `/api/children/<other-parent's-id>` → 404; child-mode `verify` → 403; send `"pointsAwarded": 999` → 422.
10. **Architecture (1 min)** — show the Mermaid diagram from the README and the module folders.

## Likely viva questions (prepare short answers)
- Why cookie auth and not localStorage JWT? (httpOnly cookies are not readable by JavaScript → XSS cannot steal them; CSRF handled with SameSite + custom header + Origin check.)
- How is duplicate reward prevented? (atomic `findOneAndUpdate` from `submitted` → `approved`; only one request can win; points are *derived* from approved records, never incremented.)
- How does child mode work without child accounts? (a parent-issued token locked to one child; exiting needs the parent password.)
- How does the recommendation engine stay safe? (hard filters first, scoring second; an AI re-ranker could only reorder already-eligible items.)
- What would you add next? (email reminders, password reset, admin content UI, expert-reviewed safety content, Hindi localisation.)
