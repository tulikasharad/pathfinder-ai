import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Mirror Convex's useQuery API shape for Supabase.
 *
 * useQuery(fetchFn, args) → returns data | undefined while loading.
 * Re-runs when any value in args changes.
 */
export function useQuery<T>(
  fetchFn: (args: any) => Promise<T>,
  args?: Record<string, unknown>
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;
    setData(undefined);

    fetchFnRef
      .current(args ?? {})
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(undefined);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(args ?? {})]);

  return data;
}

/**
 * Mirror Convex's useMutation API shape for Supabase.
 *
 * const mutate = useMutation(fn);
 * await mutate({ key: value });       → runs fn({ key: value }) immediately
 * await mutate();                      → runs fn() immediately
 * Returns a refetch helper after each call.
 */
export function useMutation<TArgs = void, TReturn = unknown>(
  fn: (args: TArgs) => Promise<TReturn>
): (args?: TArgs) => Promise<TReturn> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutate = useCallback(
    async (args?: TArgs): Promise<TReturn> => {
      return fnRef.current(args as TArgs);
    },
    []
  );

  return mutate;
}
