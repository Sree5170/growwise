import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data with loading/error state and a reload function. Ignores results from stale requests.
export function useAsync(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const seq = useRef(0);
  const fnRef = useRef(fn); fnRef.current = fn;
  const run = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await fnRef.current(); if (id === seq.current) setState({ data, error: null, loading: false }); }
    catch (error) { if (id === seq.current) setState({ data: null, error, loading: false }); }
  }, []);
  useEffect(() => { if (enabled) run(); else setState({ data: null, error: null, loading: false }); }, [enabled, run, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: run };
}
