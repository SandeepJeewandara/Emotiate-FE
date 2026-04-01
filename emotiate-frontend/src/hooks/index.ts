import { useState, useCallback } from 'react';

// ─── Notification hook ────────────────────────────────────────────────────────
export type NotifType = 'success' | 'error' | 'info';
export interface NotifItem { id: number; msg: string; type: NotifType; }

export function useNotif() {
  const [items, setItems] = useState<NotifItem[]>([]);

  const push = useCallback((msg: string, type: NotifType = 'success') => {
    const id = Date.now();
    setItems((p) => [...p, { id, msg, type }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3400);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((p) => p.filter((x) => x.id !== id));
  }, []);

  return { items, push, remove };
}

// ─── Async state hook ─────────────────────────────────────────────────────────
export interface AsyncState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null, loading: false, error: null,
  });

  const run = useCallback(async (promise: Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await promise;
      setState({ data, loading: false, error: null });
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      setState({ data: null, loading: false, error });
      throw e;
    }
  }, []);

  return { ...state, run };
}
