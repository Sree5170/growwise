// Locally defined, original question banks (no external API). Served by GET /api/games/:type/questions.
// `answer` is the correct option text; the server re-scores submitted answers against this bank.
const q = (id, ageGroup, prompt, options, answer, hint, explanation) => ({ id, ageGroup, prompt, options, answer, hint, explanation });

export const PATTERN_QUESTIONS = [
  q('p35-1', '3-5', 'What comes next? 🔴 🔵 🔴 🔵 🔴 ?', ['🔴', '🔵', '🟢'], '🔵', 'The colours take turns.', 'The pattern goes red, blue, red, blue. After red comes blue.'),
  q('p35-2', '3-5', 'Count with me: 1, 2, 3, ... what comes next?', ['4', '2', '7'], '4', 'We add one each time.', 'Counting goes up by one: 1, 2, 3, 4.'),
  q('p35-3', '3-5', 'Which animal is the biggest?', ['🐜 Ant', '🐘 Elephant', '🐶 Dog'], '🐘 Elephant', 'Think about which one is taller than a house door.', 'An elephant is much bigger than a dog or an ant.'),
  q('p35-4', '3-5', 'What comes next? ⭐ ⭐ 🌙 ⭐ ⭐ 🌙 ⭐ ⭐ ?', ['⭐', '🌙', '☀️'], '🌙', 'Two stars, then one moon, again and again.', 'The pattern is star, star, moon. After two stars comes a moon.'),
  q('p35-5', '3-5', 'Which group has MORE? Group A: 3 apples 🍎🍎🍎. Group B: 5 apples 🍎🍎🍎🍎🍎', ['Group A', 'Group B', 'They are the same'], 'Group B', 'Count each group.', '5 is more than 3, so Group B has more.'),
  q('p35-6', '3-5', 'What comes next? 🔺 🟦 🔺 🟦 🔺 ?', ['🔺', '🟦', '⭕'], '🟦', 'Look at how the shapes take turns.', 'Triangle, square, triangle, square... next is a square.'),
  q('p68-1', '6-8', 'What number comes next? 2, 4, 6, 8, ?', ['9', '10', '12'], '10', 'How much is added each time?', 'We add 2 each time, so 8 + 2 = 10.'),
  q('p68-2', '6-8', 'What number comes next? 5, 10, 15, ?', ['18', '20', '25'], '20', 'Count in fives.', 'We add 5 each time: 15 + 5 = 20.'),
  q('p68-3', '6-8', 'You have 9 stickers and give 4 to a friend. How many are left?', ['4', '5', '6'], '5', 'Take away 4 from 9.', '9 − 4 = 5 stickers.'),
  q('p68-4', '6-8', 'Which number does NOT belong? 2, 4, 7, 8', ['2', '4', '7', '8'], '7', 'Look at which numbers are even.', '2, 4 and 8 are even numbers. 7 is odd.'),
  q('p68-5', '6-8', 'What number comes next? 10, 9, 8, 7, ?', ['5', '6', '8'], '6', 'The numbers are going down.', 'We subtract 1 each time: 7 − 1 = 6.'),
  q('p68-6', '6-8', 'Which shape has 4 equal sides?', ['Triangle', 'Square', 'Circle'], 'Square', 'Think of a window pane or a chess board square.', 'A square has four sides that are all the same length.'),
  q('p912-1', '9-12', 'What comes next? 3, 6, 12, 24, ?', ['36', '48', '30'], '48', 'Look at how each number relates to the one before.', 'Each number is doubled: 24 × 2 = 48.'),
  q('p912-2', '9-12', 'What comes next? 1, 4, 9, 16, ?', ['20', '24', '25'], '25', 'These are special numbers: 1×1, 2×2, 3×3...', 'These are square numbers. The next is 5 × 5 = 25.'),
  q('p912-3', '9-12', 'What comes next? 2, 3, 5, 8, 12, ?', ['16', '17', '18'], '17', 'Look at the gaps between numbers: 1, 2, 3, 4...', 'The gaps grow by one each time (+1, +2, +3, +4), so the next gap is +5: 12 + 5 = 17.'),
  q('p912-4', '9-12', 'If 3 pens cost ₹15, how much do 5 pens cost?', ['₹20', '₹25', '₹30'], '₹25', 'Find the cost of one pen first.', '15 ÷ 3 = ₹5 per pen, and 5 × 5 = ₹25.'),
  q('p912-5', '9-12', 'What comes next? A, C, E, G, ?', ['H', 'I', 'J'], 'I', 'Skip one letter each time.', 'We skip a letter every time: A, (B), C, (D), E, (F), G, (H), I.'),
  q('p912-6', '9-12', 'What is 25% of 80?', ['10', '20', '25'], '20', '25% is the same as one quarter.', 'One quarter of 80 is 80 ÷ 4 = 20.'),
  q('p912-7', '9-12', 'Half of a number is 18. What is the number?', ['9', '36', '20'], '36', 'Do the opposite of halving.', 'Doubling 18 gives 36.'),
  q('p1317-1', '13-17', 'What comes next? 2, 6, 18, 54, ?', ['108', '162', '72'], '162', 'Find what each number is multiplied by.', 'Each term is multiplied by 3: 54 × 3 = 162.'),
  q('p1317-2', '13-17', 'What comes next? 1, 8, 27, 64, ?', ['100', '125', '216'], '125', 'Think of cubes: 1³, 2³, 3³, 4³.', 'These are cube numbers. The next is 5³ = 125.'),
  q('p1317-3', '13-17', 'What comes next? 5, 11, 23, 47, ?', ['71', '95', '94'], '95', 'Try doubling and adding something.', 'Each term is (previous × 2) + 1: 47 × 2 + 1 = 95.'),
  q('p1317-4', '13-17', 'A train travels 150 km in 2.5 hours. What is its average speed?', ['50 km/h', '60 km/h', '75 km/h'], '60 km/h', 'Speed = distance ÷ time.', '150 ÷ 2.5 = 60 km/h.'),
  q('p1317-5', '13-17', 'Solve for x: x + 7 = 3x − 5', ['x = 4', 'x = 6', 'x = 8'], 'x = 6', 'Gather the x terms on one side.', '7 + 5 = 3x − x, so 12 = 2x and x = 6. Check: 6 + 7 = 13 and 18 − 5 = 13.'),
  q('p1317-6', '13-17', 'What is the probability of rolling an even number on a fair six-sided die?', ['1/3', '1/2', '2/3'], '1/2', 'Count the even faces: 2, 4, 6.', 'Three of the six faces are even, so 3/6 = 1/2.'),
  q('p1317-7', '13-17', 'What comes next? 0, 1, 3, 6, 10, ?', ['14', '15', '16'], '15', 'The gaps go up by one each time.', 'Gaps are +1, +2, +3, +4, so the next is +5: 10 + 5 = 15 (triangular numbers).'),
];

export const RIDDLE_QUESTIONS = [
  q('r35-1', '3-5', 'I have a face and two hands, but no arms or legs. What am I?', ['A clock', 'A cat', 'A spoon'], 'A clock', 'You look at me to know the time.', 'A clock has a face and hands that point to the time.'),
  q('r35-2', '3-5', 'I am yellow and bendy, and monkeys love to eat me. What am I?', ['A banana', 'A pencil', 'A shoe'], 'A banana', 'You peel me before you eat me.', 'Bananas are yellow, curved fruit that monkeys enjoy.'),
  q('r35-3', '3-5', 'I come out at night and twinkle in the sky. What am I?', ['A star', 'A fish', 'A chair'], 'A star', 'Look up on a clear night.', 'Stars shine in the night sky and seem to twinkle.'),
  q('r35-4', '3-5', 'I keep you dry when it rains. You hold me over your head. What am I?', ['An umbrella', 'A ball', 'A book'], 'An umbrella', 'You open me on a rainy day.', 'An umbrella keeps rain off your head.'),
  q('r35-5', '3-5', 'I am round and I bounce. You can kick me or throw me. What am I?', ['A ball', 'A blanket', 'A cup'], 'A ball', 'Think of playing in the park.', 'A ball is round and bounces, so we can kick it or throw it.'),
  q('r68-1', '6-8', 'What has keys but cannot open any lock?', ['A piano', 'A door', 'A box'], 'A piano', 'You press the keys to make music.', 'A piano has keys you press to make sounds, not to unlock things.'),
  q('r68-2', '6-8', 'What gets wetter the more it dries?', ['A towel', 'A sponge cake', 'A leaf'], 'A towel', 'You use me after a bath.', 'A towel soaks up water while drying you, so it gets wetter.'),
  q('r68-3', '6-8', 'What has a neck but no head?', ['A bottle', 'A tree', 'A chair'], 'A bottle', 'Think of something you drink from.', 'A bottle has a narrow neck at the top but no head.'),
  q('r68-4', '6-8', 'What can you catch but not throw?', ['A cold', 'A ball', 'A fish'], 'A cold', 'Think about sneezing.', 'You can catch a cold (get sick), but you cannot throw one.'),
  q('r68-5', '6-8', 'The more you take of me, the more you leave behind. What am I?', ['Footsteps', 'Cookies', 'Water'], 'Footsteps', 'Think about walking on sand.', 'Every step you take leaves a footstep behind you.'),
  q('r912-1', '9-12', 'What has to be broken before you can use it?', ['An egg', 'A stone', 'A pencil'], 'An egg', 'Think about breakfast.', 'You crack an egg before you can cook or use it.'),
  q('r912-2', '9-12', 'I speak without a mouth and hear without ears. What am I?', ['An echo', 'A phone', 'A parrot'], 'An echo', 'Shout in a big valley or empty hall.', 'An echo repeats the sounds it hears even though it has no body.'),
  q('r912-3', '9-12', 'What goes up but never comes down?', ['Your age', 'A balloon', 'A kite'], 'Your age', 'It changes every birthday.', 'Your age only increases as time passes.'),
  q('r912-4', '9-12', 'What has many teeth but cannot bite?', ['A comb', 'A dog', 'A saw blade only'], 'A comb', 'You use me on your hair.', 'A comb has many teeth, but they are for untangling hair.'),
  q('r912-5', '9-12', 'What can travel around the world while staying in one corner?', ['A stamp', 'A cloud', 'A river'], 'A stamp', 'Think about a letter.', 'A stamp sits in the corner of an envelope while the letter travels.'),
  q('r1317-1', '13-17', 'The more of me there is, the less you see. What am I?', ['Darkness', 'Fog only', 'Silence'], 'Darkness', 'Think about what happens when lights go out.', 'The more darkness there is, the less you can see.'),
  q('r1317-2', '13-17', 'I have cities but no houses, mountains but no trees, and water but no fish. What am I?', ['A map', 'A dream', 'A globe only'], 'A map', 'You use me to find your way.', 'A map shows cities, mountains and water without containing them.'),
  q('r1317-3', '13-17', 'What can fill a room but takes up no space?', ['Light', 'Air in a balloon', 'Furniture'], 'Light', 'Switch it on and the room is full of me.', 'Light fills a room but has no volume or weight.'),
  q('r1317-4', '13-17', 'I am tall when I am young and short when I am old. What am I?', ['A candle', 'A tree', 'A person'], 'A candle', 'I get shorter as I give light.', 'A candle melts and gets shorter the longer it burns.'),
  q('r1317-5', '13-17', 'What begins with T, ends with T, and has T inside it?', ['A teapot', 'A tent', 'A tablet'], 'A teapot', 'You might find me in the kitchen.', 'A teapot starts with T, ends with T, and holds tea.'),
];

export const MEMORY_CONFIG = {
  '3-5': { pairs: 4, symbols: ['🐶', '🐱', '🐟', '🐸'] },
  '6-8': { pairs: 6, symbols: ['🍎', '🚗', '⭐', '🐢', '🎈', '🌼'] },
  '9-12': { pairs: 8, symbols: ['🦊', '🌈', '🚀', '🍕', '🎸', '🐬', '🌵', '🧩'] },
  '13-17': { pairs: 10, symbols: ['🦉', '🌋', '🛰️', '🎻', '🧭', '🔭', '🍉', '🏔️', '⚓', '🪁'] },
};

export const GAMES = [
  { type: 'memory-match', name: 'Memory Match', description: 'Flip cards and find all the matching pairs.', emoji: '🃏', skill: 'Working memory and attention' },
  { type: 'pattern-quiz', name: 'Number & Pattern Quiz', description: 'Spot the pattern and solve number puzzles.', emoji: '🔢', skill: 'Pattern spotting and number sense' },
  { type: 'riddle-challenge', name: 'Riddle Challenge', description: 'Think it through and solve the riddle.', emoji: '🧠', skill: 'Language and lateral thinking' },
];
export const BANKS = { 'pattern-quiz': PATTERN_QUESTIONS, 'riddle-challenge': RIDDLE_QUESTIONS };
