import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { childService } from '../services/childService.js';
import { useAuth } from './AuthContext.jsx';

const Ctx = createContext(null);
export const useChildren = () => useContext(Ctx);
const KEY = 'gw_selected_child'; // only a non-sensitive id is stored in the browser

// Parent mode: loads all children and tracks the selected one. Child mode: the one locked profile.
export function ChildrenProvider({ children: kids }) {
  const { isParent, isChild, child: sessionChild, user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(() => { try { return localStorage.getItem(KEY); } catch { return null; } });

  const reload = useCallback(async () => {
    if (!isParent) return;
    setLoading(true); setError(null);
    try { setList(await childService.list()); } catch (e) { setError(e); } finally { setLoading(false); }
  }, [isParent]);

  useEffect(() => { if (isParent && user) reload(); if (!user) setList([]); }, [isParent, user, reload]);

  const select = useCallback((id) => { setSelectedId(id); try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ } }, []);

  const selected = isChild ? sessionChild : (list.find((c) => c._id === selectedId) || list[0] || null);
  const value = useMemo(() => ({ list: isChild ? (sessionChild ? [sessionChild] : []) : list, selected, select, reload, loading, error }), [list, selected, select, reload, loading, error, isChild, sessionChild]);
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}
