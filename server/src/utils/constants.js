export const AGE_GROUPS = ['3-5', '6-8', '9-12', '13-17'];
export const AGE_GROUP_RANGES = { '3-5': [3, 5], '6-8': [6, 8], '9-12': [9, 12], '13-17': [13, 17] };
export const CATEGORIES = ['physical', 'brain-games', 'creativity', 'life-skills', 'outdoor', 'disaster-preparedness', 'family'];
export const CATEGORY_LABELS = {
  physical: 'Physical Activities', 'brain-games': 'Brain Games', creativity: 'Creativity', 'life-skills': 'Life Skills',
  outdoor: 'Outdoor Adventures', 'disaster-preparedness': 'Disaster Preparedness', family: 'Family Activities',
};
// Recommendation "domains" used to balance the week
export const CATEGORY_DOMAIN = {
  physical: 'physical', outdoor: 'physical', 'brain-games': 'cognitive', creativity: 'creative',
  'life-skills': 'practical', 'disaster-preparedness': 'safety', family: 'practical',
};
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const COMPLETION_METHODS = ['parent-verified', 'self-reported', 'quiz-based'];
export const TASK_STATUSES = ['assigned', 'submitted', 'approved', 'needs-revision', 'cancelled'];
export const GAME_TYPES = ['memory-match', 'pattern-quiz', 'riddle-challenge'];
export const HAZARD_TYPES = ['earthquake', 'flood', 'fire', 'lightning', 'heat', 'emergency-contacts', 'emergency-kit', 'family-plan'];
export const GOALS = ['move-more', 'less-screen-time', 'logical-thinking', 'creativity', 'life-skills', 'safety-awareness'];
export const INTERESTS = ['sports', 'art', 'music', 'nature', 'science', 'building', 'cooking', 'stories', 'puzzles', 'animals', 'dance', 'gardening'];
export const PHYSICAL_TYPES = ['walking', 'running', 'cycling', 'swimming', 'yoga-stretching', 'dance', 'team-sport', 'playground-play', 'martial-arts', 'other'];
