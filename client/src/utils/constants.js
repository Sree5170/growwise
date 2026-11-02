export const AGE_GROUPS = [{ value: '3-5', label: 'Ages 3–5' }, { value: '6-8', label: 'Ages 6–8' }, { value: '9-12', label: 'Ages 9–12' }, { value: '13-17', label: 'Ages 13–17' }];
export const CATEGORIES = [
  { value: 'physical', label: 'Physical Activities', emoji: '🏃', tone: 'mint' },
  { value: 'brain-games', label: 'Brain Games', emoji: '🧩', tone: 'sky' },
  { value: 'creativity', label: 'Creativity', emoji: '🎨', tone: 'coral' },
  { value: 'life-skills', label: 'Life Skills', emoji: '🧺', tone: 'sun' },
  { value: 'outdoor', label: 'Outdoor Adventures', emoji: '🌳', tone: 'mint' },
  { value: 'disaster-preparedness', label: 'Disaster Preparedness', emoji: '🛟', tone: 'coral' },
  { value: 'family', label: 'Family Activities', emoji: '👨‍👩‍👧', tone: 'sky' },
];
export const categoryInfo = (v) => CATEGORIES.find((c) => c.value === v) || { label: v, emoji: '⭐', tone: 'mint' };
export const INTERESTS = ['sports', 'art', 'music', 'nature', 'science', 'building', 'cooking', 'stories', 'puzzles', 'animals', 'dance', 'gardening'];
export const GOALS = [
  { value: 'move-more', label: 'Move more' }, { value: 'less-screen-time', label: 'Less recreational screen time' }, { value: 'logical-thinking', label: 'Logical thinking' },
  { value: 'creativity', label: 'Creativity' }, { value: 'life-skills', label: 'Life skills' }, { value: 'safety-awareness', label: 'Safety awareness' },
];
export const AVATARS = [{ key: 'sprout', emoji: '🌱' }, { key: 'fox', emoji: '🦊' }, { key: 'comet', emoji: '☄️' }, { key: 'turtle', emoji: '🐢' }, { key: 'panda', emoji: '🐼' }, { key: 'rocket', emoji: '🚀' }, { key: 'owl', emoji: '🦉' }, { key: 'dolphin', emoji: '🐬' }];
export const avatarEmoji = (k) => AVATARS.find((a) => a.key === k)?.emoji || '🌱';
export const PHYSICAL_TYPES = [
  ['walking', 'Walking'], ['running', 'Running'], ['cycling', 'Cycling'], ['swimming', 'Swimming'], ['yoga-stretching', 'Yoga / stretching'], ['dance', 'Dance'],
  ['team-sport', 'Team sport'], ['playground-play', 'Playground play'], ['martial-arts', 'Martial arts'], ['other', 'Other'],
];
export const physicalLabel = (v) => PHYSICAL_TYPES.find((t) => t[0] === v)?.[1] || v;
export const STATUS_LABELS = { assigned: 'To do', submitted: 'Waiting for review', approved: 'Approved', 'needs-revision': 'Needs another try', cancelled: 'Cancelled' };
export const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Challenging' };
export const GAME_LABELS = { 'memory-match': 'Memory Match', 'pattern-quiz': 'Number & Pattern Quiz', 'riddle-challenge': 'Riddle Challenge' };
