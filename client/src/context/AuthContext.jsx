import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { childService } from '../services/childService.js';
import { setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, mode: null, child: null, loading: true });

  const apply = (r) => setState({ user: r.user, mode: r.mode, child: r.child || null, loading: false });
  const clear = useCallback(() => setState({ user: null, mode: null, child: null, loading: false }), []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    authService.me().then(apply).catch(clear);
  }, [clear]);

  const value = useMemo(() => ({
    ...state,
    isParent: state.mode === 'parent', isChild: state.mode === 'child', isAdmin: state.user?.role === 'admin',
    login: async (body) => { const r = await authService.login(body); apply(r); return r; },
    register: async (body) => { const r = await authService.register(body); apply(r); return r; },
    logout: async () => { try { await authService.logout(); } finally { clear(); } },
    startChildMode: async (childId) => { const r = await childService.startSession(childId); apply(r); return r; },
    exitChildMode: async (password) => { const r = await authService.exitChildMode(password); apply(r); return r; },
    refreshUser: (user) => setState((s) => ({ ...s, user })),
  }), [state, clear]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
