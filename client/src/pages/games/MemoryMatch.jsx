import { useEffect, useRef, useState } from 'react';

// cards: [{ id, symbol }] from the server. The server validates pairs/moves when the result is submitted.
export default function MemoryMatch({ data, onFinish }) {
  const [flipped, setFlipped] = useState([]); const [matched, setMatched] = useState(new Set()); const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false); const startedAt = useRef(Date.now()); const [msg, setMsg] = useState('Flip two cards to find a pair.');
  const cols = data.cards.length <= 8 ? 4 : data.cards.length <= 12 ? 4 : 5;

  useEffect(() => {
    if (matched.size === data.pairs) onFinish({ pairs: data.pairs, moves, durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) });
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (card) => {
    if (lock || flipped.includes(card.id) || matched.has(card.symbol)) return;
    const next = [...flipped, card.id]; setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1); setLock(true);
      const [a, b] = next.map((id) => data.cards.find((c) => c.id === id));
      if (a.symbol === b.symbol) { setMsg('It’s a match! ✨'); setMatched((m) => new Set(m).add(a.symbol)); setFlipped([]); setLock(false); }
      else { setMsg('Not a match — remember where they are.'); setTimeout(() => { setFlipped([]); setLock(false); }, 900); }
    }
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm font-bold"><span>Moves: {moves}</span><span>Pairs: {matched.size} / {data.pairs}</span></div>
      <p className="sr-only" aria-live="polite">{msg}</p>
      <div className="mx-auto grid max-w-md gap-2.5 sm:gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {data.cards.map((c, i) => {
          const up = flipped.includes(c.id) || matched.has(c.symbol);
          return (
            <button key={c.id} type="button" onClick={() => flip(c)} aria-label={up ? `Card ${i + 1}: ${c.symbol}${matched.has(c.symbol) ? ', matched' : ''}` : `Card ${i + 1}, face down`} aria-pressed={up}
              className={`aspect-square rounded-2xl text-3xl shadow-card transition-colors sm:text-4xl ${matched.has(c.symbol) ? 'bg-mint-100' : up ? 'bg-white ring-2 ring-sky-400' : 'bg-sky-500 hover:bg-sky-600'}`}>
              <span aria-hidden="true">{up ? c.symbol : '?'}</span>
            </button>);
        })}
      </div>
    </div>
  );
}
