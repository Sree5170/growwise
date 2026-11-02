import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import ProtectedRoute, { Splash } from './components/layout/ProtectedRoute.jsx';

const L = (f) => lazy(f);
const Landing = L(() => import('./pages/public/Landing.jsx'));
const About = L(() => import('./pages/public/InfoPages.jsx').then((m) => ({ default: m.About })));
const Features = L(() => import('./pages/public/InfoPages.jsx').then((m) => ({ default: m.Features })));
const HowItWorks = L(() => import('./pages/public/InfoPages.jsx').then((m) => ({ default: m.HowItWorks })));
const Privacy = L(() => import('./pages/public/InfoPages.jsx').then((m) => ({ default: m.Privacy })));
const NotFound = L(() => import('./pages/public/InfoPages.jsx').then((m) => ({ default: m.NotFound })));
const Login = L(() => import('./pages/public/AuthPages.jsx').then((m) => ({ default: m.Login })));
const Register = L(() => import('./pages/public/AuthPages.jsx').then((m) => ({ default: m.Register })));
const ParentDashboard = L(() => import('./pages/parent/ParentDashboard.jsx'));
const Children = L(() => import('./pages/parent/Children.jsx'));
const Tasks = L(() => import('./pages/parent/Tasks.jsx'));
const Progress = L(() => import('./pages/progress/Progress.jsx'));
const Settings = L(() => import('./pages/settings/Settings.jsx'));
const ChildDashboard = L(() => import('./pages/child/ChildDashboard.jsx'));
const ActivityLibrary = L(() => import('./pages/activities/ActivityLibrary.jsx'));
const Games = L(() => import('./pages/games/Games.jsx'));
const GamePlay = L(() => import('./pages/games/GamePlay.jsx'));
const SafetyAcademy = L(() => import('./pages/safety/SafetyAcademy.jsx'));
const LessonPage = L(() => import('./pages/safety/LessonPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute require="parent" />}>
          <Route path="parent/dashboard" element={<ParentDashboard />} />
          <Route path="parent/children" element={<Children />} />
          <Route path="parent/tasks" element={<Tasks />} />
          <Route path="parent/progress" element={<Progress />} />
          <Route path="parent/settings" element={<Settings />} />
        </Route>
        <Route element={<ProtectedRoute require="child" />}>
          <Route path="child/dashboard" element={<ChildDashboard />} />
        </Route>
        <Route element={<ProtectedRoute require="any" />}>
          <Route path="activities" element={<ActivityLibrary />} />
          <Route path="games" element={<Games />} />
          <Route path="games/:type" element={<GamePlay />} />
          <Route path="safety-academy" element={<SafetyAcademy />} />
          <Route path="safety-academy/:id" element={<LessonPage />} />
        </Route>
        <Route element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
      </Routes>
    </Suspense>
  );
}
