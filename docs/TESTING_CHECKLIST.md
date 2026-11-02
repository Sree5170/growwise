# GrowWise manual testing checklist

Tick each item on a clean database (`npm run seed`). Test on a desktop width (≥1280px) **and** a phone width (375px, e.g. browser dev-tools device mode).

## Accounts and security
- [ ] Register with empty fields → inline messages appear; nothing is submitted
- [ ] Register with `weakpass`, `short1`, `12345678` → each rejected with a clear message
- [ ] Register with mismatching confirmation → "Passwords do not match"
- [ ] Register with valid data → lands on **Children** page, logged in
- [ ] Register again with the same email → "already exists" message
- [ ] Log out, then open `/parent/dashboard` → redirected to login
- [ ] Wrong password shows one generic message; correct password logs in
- [ ] Reload the page while logged in → still logged in (cookie session)

## Children
- [ ] Add a child: empty form shows validation; valid form creates the profile
- [ ] Edit nickname, interests, goals, recommendation settings → saved and visible after reload
- [ ] Add a second child; the sidebar switcher changes the child shown on every page
- [ ] Delete a child → confirmation dialog → profile and its records disappear

## Activities and tasks
- [ ] `/activities` shows 60+ activities; search "puzzle", category filter, age filter, duration filter, clear filters
- [ ] Open an activity: steps, materials, safety notes, supervision flag and points are shown
- [ ] Assign an activity with a due date and note; it appears under **Tasks → To do**
- [ ] The assign picker only offers activities suitable for the child's age group
- [ ] Assign the same activity for the same day twice → "already assigned"
- [ ] Edit a pending task's dates/note; cancel another one (confirmation)

## Child mode and rewards
- [ ] **Open child mode** → playful dashboard with level path, missions, badges
- [ ] Open a mission, add a note, submit → status becomes "Waiting for review"
- [ ] Child cannot open `/parent/dashboard` (redirected back)
- [ ] **Grown-ups** button: wrong password is refused; right password returns to the parent area
- [ ] Parent sees the submission under "Needs your review"; **Ask for another try** returns it to the child with the note
- [ ] Child resubmits; parent **Approves** → points toast, badge toast ("First Step"), level progress updates
- [ ] Reloading or approving again never adds points twice (second approval is refused)

## Movement tracking
- [ ] Child: "I moved today" → saved as *child-reported*
- [ ] Parent: Progress → Log movement → saved as *parent-reported*; Verify upgrades a child entry
- [ ] Minutes 0 or 700, a future date → refused with a message
- [ ] Charts and totals separate child-reported and parent-reported minutes, with the "not device-measured" note

## Brain games
- [ ] Memory Match: flip, match, finish; result shows moves; Play again works; keyboard only works (Tab/Enter)
- [ ] Number & Pattern Quiz: hint, immediate feedback + explanation, results, replay
- [ ] Riddle Challenge: same checks
- [ ] Games hub shows rounds played / best score after playing; wording never claims to measure intelligence

## Safety Academy
- [ ] Lessons list shows the "educational exercise, not live alerts" notice
- [ ] Open a lesson: intro, objectives, steps, parent-supervised practice, checklist, quiz, sources
- [ ] Submit the quiz with wrong answers → not completed, explanations shown, Try again
- [ ] Pass the quiz → "Lesson complete! +15 points" once; repeating gives no extra points
- [ ] Print the checklist (browser print preview hides navigation)

## Progress, reports, recommendations
- [ ] A brand-new child shows honest empty states (no fake data)
- [ ] Day / week / month ranges change the numbers and charts
- [ ] Weekly report lists highlights and comparisons with last week; Print works
- [ ] Dashboard recommendations show a reason each; they respect age, available minutes, supervision and outdoor-space settings

## Settings
- [ ] Update name and reminder preferences; change password (old password then stops working)
- [ ] "Hide child's notes" removes notes from the weekly report
- [ ] Delete account → password required → everything removed; the old login no longer works

## Responsive and accessibility
- [ ] No horizontal scrolling on any page at 375px, 768px and 1280px
- [ ] Mobile menu (hamburger) opens and every link works
- [ ] Tab through a form and a dialog: focus is visible, dialogs trap focus and close with Esc
- [ ] Zoom to 200% — text stays readable and nothing is cut off
