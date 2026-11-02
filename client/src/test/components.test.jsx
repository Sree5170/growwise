import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '../components/forms/Field.jsx';
import Modal from '../components/modals/Modal.jsx';
import ActivityCard from '../components/cards/ActivityCard.jsx';
import { AsyncBoundary } from '../components/feedback/Feedback.jsx';
import QuizGame from '../pages/games/QuizGame.jsx';
import MemoryMatch from '../pages/games/MemoryMatch.jsx';

describe('Field', () => {
  it('links the label to the input and announces errors accessibly', () => {
    render(<Field label="Nickname" error="Enter a nickname" />);
    const input = screen.getByLabelText('Nickname');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a nickname');
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
  });
});

describe('Modal', () => {
  it('is an accessible dialog that closes on Escape and moves focus inside', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Hello"><button>Inside</button></Modal>);
    expect(screen.getByRole('dialog', { name: 'Hello' })).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
  it('renders nothing when closed', () => { render(<Modal open={false} onClose={() => {}} title="x">y</Modal>); expect(screen.queryByRole('dialog')).toBeNull(); });
});

describe('ActivityCard', () => {
  const activity = { _id: '1', title: 'Story Stones', description: 'Paint stones', category: 'creativity', points: 10, durationMinutes: 20, minimumAge: 4, maximumAge: 9, difficulty: 'easy', requiresAdultSupervision: true };
  it('shows the key facts and the adult-supervision flag', () => {
    render(<ActivityCard activity={activity} />);
    expect(screen.getByText('Story Stones')).toBeInTheDocument(); expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('Ages 4–9')).toBeInTheDocument(); expect(screen.getByText('Adult nearby')).toBeInTheDocument();
  });
  it('opens details when the title is activated', async () => {
    const onOpen = vi.fn(); render(<ActivityCard activity={activity} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Story Stones' })); expect(onOpen).toHaveBeenCalledWith(activity);
  });
});

describe('AsyncBoundary', () => {
  const render1 = (state) => render(<AsyncBoundary state={state} skeleton={<p>skeleton</p>}>{(d) => <p>data:{d}</p>}</AsyncBoundary>);
  it('shows a skeleton before data, even on the first render before loading starts', () => { render1({ data: null, loading: false, error: null }); expect(screen.getByText('skeleton')).toBeInTheDocument(); });
  it('shows an error with retry', async () => {
    const reload = vi.fn(); render1({ data: null, loading: false, error: new Error('boom'), reload });
    expect(screen.getByRole('alert')).toHaveTextContent('boom'); await userEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(reload).toHaveBeenCalled();
  });
  it('REGRESSION: keeps showing existing data while reloading (child components keep their state)', () => {
    function Counter() { const [n, setN] = useState(0); return <button onClick={() => setN(n + 1)}>count {n}</button>; }
    const { rerender } = render(<AsyncBoundary state={{ data: 1, loading: false, error: null }}>{() => <Counter />}</AsyncBoundary>);
    return userEvent.click(screen.getByText('count 0')).then(() => {
      rerender(<AsyncBoundary state={{ data: 1, loading: true, error: null }}>{() => <Counter />}</AsyncBoundary>);
      expect(screen.getByText('count 1')).toBeInTheDocument();
    });
  });
});

describe('QuizGame', () => {
  const data = { questions: [
    { id: 'a', prompt: 'Next: 2, 4, 6, ?', options: ['7', '8'], answer: '8', hint: 'Add two', explanation: 'We add 2 each time.' },
    { id: 'b', prompt: 'Biggest?', options: ['Ant', 'Elephant'], answer: 'Elephant', hint: 'Think size', explanation: 'Elephants are huge.' },
  ] };
  it('gives immediate feedback, supports hints and submits the answers for server scoring', async () => {
    const onFinish = vi.fn(); render(<QuizGame data={data} onFinish={onFinish} />);
    await userEvent.click(screen.getByRole('button', { name: 'Need a hint?' })); expect(screen.getByText('Add two')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^7/ }));
    expect(screen.getByText('We add 2 each time.')).toBeInTheDocument(); expect(screen.getByText(/Good try/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^8/ })).toBeDisabled(); // cannot change an answer
    await userEvent.click(screen.getByRole('button', { name: 'Next question' }));
    await userEvent.click(screen.getByRole('button', { name: 'Elephant' }));
    expect(screen.getByText(/Nice thinking/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'See my results' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    const payload = onFinish.mock.calls[0][0];
    expect(payload.answers).toEqual([{ questionId: 'a', answer: '7' }, { questionId: 'b', answer: 'Elephant' }]);
    expect(payload.hintsUsed).toBe(1); expect(payload).not.toHaveProperty('score'); // the client never sends a score
  });
});

describe('MemoryMatch', () => {
  const data = { pairs: 2, cards: [{ id: 0, symbol: '🐶' }, { id: 1, symbol: '🐱' }, { id: 2, symbol: '🐶' }, { id: 3, symbol: '🐱' }] };
  it('counts moves, matches pairs and reports completion', async () => {
    const onFinish = vi.fn(); render(<MemoryMatch data={data} onFinish={onFinish} />);
    const cards = () => screen.getAllByRole('button');
    await userEvent.click(cards()[0]); await userEvent.click(cards()[2]);
    expect(screen.getByText('Pairs: 1 / 2')).toBeInTheDocument();
    await userEvent.click(cards()[1]); await userEvent.click(cards()[3]);
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(onFinish.mock.calls[0][0]).toMatchObject({ pairs: 2, moves: 2 });
  });
  it('flips mismatched cards back and does not allow flipping the same card twice', async () => {
    render(<MemoryMatch data={data} onFinish={() => {}} />);
    const cards = () => screen.getAllByRole('button');
    await userEvent.click(cards()[0]); await userEvent.click(cards()[0]); expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    await userEvent.click(cards()[1]); expect(screen.getByText('Moves: 1')).toBeInTheDocument();
    await waitFor(() => expect(cards()[0]).toHaveAttribute('aria-pressed', 'false'), { timeout: 2000 });
  });
});
