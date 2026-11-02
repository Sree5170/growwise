import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function Page({ title, intro, children }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-ink-soft">{intro}</p>}
      <div className="mt-8 space-y-6 text-ink-soft [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </div>
  );
}

export const About = () => (
  <Page title="About GrowWise" intro="A child-development platform that turns healthy routines into shared, real-world adventures.">
    <section><h2>The problem</h2><p>Many families want children to move more, think creatively, learn practical skills and be prepared for emergencies, while spending less recreational time on screens. Good ideas are scattered and hard to keep consistent.</p></section>
    <section><h2>Our approach</h2><p>Parents get a simple space to choose age-appropriate activities, assign them as missions, and review progress. Children get a friendly dashboard with missions, brain games and safety lessons. Rewards celebrate effort and participation — never speed, rankings or streak penalties.</p></section>
    <section><h2>What GrowWise is not</h2><ul><li>It is not a medical or diagnostic tool; activity minutes are self-reported.</li><li>Game scores show practice, not intelligence.</li><li>The safety academy is educational and is not a live emergency alert system.</li></ul></section>
    <section><h2>A college minor project</h2><p>Built with React, Node.js, Express and MongoDB to demonstrate secure, role-based, full-stack development.</p></section>
  </Page>
);

export const Features = () => (
  <Page title="Features and benefits" intro="Everything is built around parent oversight and child-friendly, offline-first activities.">
    {[['Parent dashboard', 'Today’s missions, completion, weekly movement, brain-game practice, badges and recommended activities for the selected child.'],
      ['Activity library', 'Dozens of activities across seven categories with materials, step-by-step instructions, safety notes and supervision guidance. Search and filter by age, category and duration.'],
      ['Task workflow', 'Assign, edit, cancel, review and approve or ask for another try, with an optional note. Points are awarded once, by the server.'],
      ['Brain games', 'Memory Match, Number & Pattern Quiz and Riddle Challenge with hints, explanations and replay.'],
      ['Safety Academy', 'Earthquake, flood, fire, lightning, heat, emergency contacts, emergency kit and family planning lessons with quizzes and printable checklists.'],
      ['Progress and reports', 'Daily, weekly and monthly charts built from real records, with clear labels for self-reported activity.'],
      ['Smart recommendations', 'Transparent rules based on age, time, materials, interests, supervision and weekly balance — no AI key required.']].map(([t, d]) => (
      <section key={t}><h2>{t}</h2><p>{d}</p></section>))}
  </Page>
);

export const HowItWorks = () => (
  <Page title="How it works" intro="From sign-up to first approved mission in four steps.">
    <ol className="space-y-5 [&>li]:ml-0 [&>li]:list-none">
      {[['Create your account', 'Register as a parent. Passwords are stored hashed and sessions use secure cookies.'], ['Add a child profile', 'Choose a nickname, age group, interests and goals. No email, photo or location is collected.'],
        ['Assign missions', 'Browse the library or use recommendations, set a due date and an optional note.'], ['Review and celebrate', 'Your child opens child mode, completes missions and submits them. You approve and points and badges appear.']].map(([t, d], i) => (
        <li key={t} className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint-700 font-display text-lg font-bold text-white" aria-hidden="true">{i + 1}</span><div><h2 className="!mb-0.5">{t}</h2><p>{d}</p></div></li>))}
    </ol>
    <p><Link to="/register" className="btn-primary">Get started</Link></p>
  </Page>
);

export const Privacy = () => (
  <Page title="Privacy policy" intro="We collect only what GrowWise needs to work. This policy describes the college project as built.">
    <section><h2>What we collect</h2><ul><li>Parent: name, email address and a hashed password.</li><li>Child: a nickname, age group, interests, goals and activity preferences you choose.</li><li>Activity: assigned tasks, notes, self-reported movement minutes, game results and lesson progress.</li></ul></section>
    <section><h2>What we do not collect</h2><ul><li>No child email addresses, photos, precise location, GPS history or device sensor data.</li><li>No advertising trackers.</li></ul></section>
    <section><h2>How data is used</h2><p>Data is used only to show progress, calculate rewards and suggest activities. Recommendations use simple rules on the server; no data is sent to a third-party AI service.</p></section>
    <section><h2>Your control</h2><p>Parents can edit or delete a child profile (removing all its records) and delete the whole account from Settings.</p></section>
    <section><h2>Cookies</h2><p>One essential, httpOnly session cookie keeps you logged in. We also store the selected child’s id in your browser to remember your choice.</p></section>
    <p className="text-sm text-ink-faint">This is an educational project and the text is not legal advice. Review it with a qualified adviser before any real-world launch.</p>
  </Page>
);

export function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-6xl" aria-hidden="true">🧭</p>
      <h1 className="mt-4 text-3xl font-extrabold">This trail leads nowhere</h1>
      <p className="mt-2 text-ink-soft">We could not find the page you were looking for.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
