// Transparent badge catalog. Each rule is a pure function of a stats object (see rewards.service.js).
export const BADGES = [
  { id: 'first-mission', name: 'First Step', emoji: '🌱', description: 'Get your first mission approved', rule: (s) => s.approvedTotal >= 1 },
  { id: 'five-missions', name: 'Mission Maker', emoji: '🎯', description: 'Get 5 missions approved', rule: (s) => s.approvedTotal >= 5 },
  { id: 'ten-missions', name: 'Trail Blazer', emoji: '🧭', description: 'Get 10 missions approved', rule: (s) => s.approvedTotal >= 10 },
  { id: 'steady-routine', name: 'Steady Routine', emoji: '📅', description: 'Have missions approved on 3 different days', rule: (s) => s.approvedDays >= 3 },
  { id: 'active-week', name: 'Active Week', emoji: '🏃', description: 'Log 150 minutes of movement in one week', rule: (s) => s.bestWeekMinutes >= 150 },
  { id: 'creative-spark', name: 'Creative Spark', emoji: '🎨', description: 'Complete 3 creativity missions', rule: (s) => (s.approvedByCategory.creativity || 0) >= 3 },
  { id: 'life-skills-hero', name: 'Life Skills Hero', emoji: '🧺', description: 'Complete 3 life-skills missions', rule: (s) => (s.approvedByCategory['life-skills'] || 0) >= 3 },
  { id: 'outdoor-explorer', name: 'Outdoor Explorer', emoji: '🌳', description: 'Complete 3 outdoor missions', rule: (s) => (s.approvedByCategory.outdoor || 0) >= 3 },
  { id: 'brain-builder', name: 'Brain Builder', emoji: '🧩', description: 'Finish 5 brain games', rule: (s) => s.gameAttempts >= 5 },
  { id: 'game-sampler', name: 'Game Sampler', emoji: '🎲', description: 'Try all three brain games', rule: (s) => s.gameTypesPlayed >= 3 },
  { id: 'safety-starter', name: 'Safety Starter', emoji: '🛟', description: 'Complete your first safety lesson', rule: (s) => s.lessonsCompleted >= 1 },
  { id: 'safety-champion', name: 'Safety Champion', emoji: '🏅', description: 'Complete every safety lesson', rule: (s) => s.totalLessons > 0 && s.lessonsCompleted >= s.totalLessons },
];
export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));
export const badgeView = ({ rule, ...rest }) => rest;
