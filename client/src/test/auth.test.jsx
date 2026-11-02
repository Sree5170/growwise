import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = { user: null, mode: null, loading: false, isChild: false, login: vi.fn(), register: vi.fn() };
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => auth }));
vi.mock('../context/ChildrenContext.jsx', () => ({ useChildren: () => ({ list: [], selected: null, select: () => {}, reload: () => {} }), ChildrenProvider: ({ children }) => children }));
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const { Login, Register } = await import('../pages/public/AuthPages.jsx');
const { default: ProtectedRoute } = await import('../components/layout/ProtectedRoute.jsx');

const renderAt = (path, ui) => render(<MemoryRouter initialEntries={[path]}><Routes>{ui}</Routes></MemoryRouter>);
beforeEach(() => { Object.assign(auth, { user: null, mode: null, loading: false, isChild: false }); auth.login.mockReset(); auth.register.mockReset(); });

describe('Login form', () => {
  it('shows validation messages and does not call the API for empty input', async () => {
    renderAt('/login', <Route path="/login" element={<Login />} />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument(); expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });
  it('rejects an invalid email and submits valid credentials', async () => {
    auth.login.mockResolvedValue({});
    renderAt('/login', <Route path="/login" element={<Login />} />);
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email'); await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Email')); await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'secret123' }));
  });
  it('shows the server error message when login fails', async () => {
    auth.login.mockRejectedValue(new Error('Incorrect email or password'));
    renderAt('/login', <Route path="/login" element={<Login />} />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co'); await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
  });
});

describe('Register form password rules', () => {
  const fill = async (pw, confirm) => {
    await userEvent.type(screen.getByLabelText('Your name'), 'Asha Rao'); await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), pw); await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  };
  it.each([['short1', 'at least 8'], ['allletters', 'letter and a number'], ['12345678', 'letter and a number']])('blocks %s', async (pw, msg) => {
    renderAt('/register', <Route path="/register" element={<Register />} />);
    await fill(pw, pw); expect(await screen.findByText(new RegExp(msg))).toBeInTheDocument(); expect(auth.register).not.toHaveBeenCalled();
  });
  it('blocks mismatched confirmation and accepts a valid password', async () => {
    renderAt('/register', <Route path="/register" element={<Register />} />);
    await fill('Passw0rd-ok', 'Passw0rd-no'); expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Confirm password')); await userEvent.type(screen.getByLabelText('Confirm password'), 'Passw0rd-ok');
    auth.register.mockResolvedValue({}); await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(auth.register).toHaveBeenCalledWith({ name: 'Asha Rao', email: 'asha@example.com', password: 'Passw0rd-ok' }));
  });
});

describe('ProtectedRoute', () => {
  const tree = (<>
    <Route path="/login" element={<p>login page</p>} />
    <Route element={<ProtectedRoute require="parent" withLayout={false} />}><Route path="/parent/dashboard" element={<p>parent area</p>} /></Route>
    <Route path="/child/dashboard" element={<p>child area</p>} />
  </>);
  it('sends anonymous visitors to login', () => { renderAt('/parent/dashboard', tree); expect(screen.getByText('login page')).toBeInTheDocument(); });
  it('sends child-mode sessions away from parent routes', () => { Object.assign(auth, { user: { name: 'P' }, mode: 'child', isChild: true }); renderAt('/parent/dashboard', tree); expect(screen.getByText('child area')).toBeInTheDocument(); });
  it('lets parents in', () => { Object.assign(auth, { user: { name: 'P' }, mode: 'parent' }); renderAt('/parent/dashboard', tree); expect(screen.getByText('parent area')).toBeInTheDocument(); });
});
