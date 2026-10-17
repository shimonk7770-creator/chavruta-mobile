// src/hooks/use-load.ts
// טעינת נתונים ממסך: מחזיר { data, error, loading, refreshing, reload, refresh }.
// טוען בכניסה למסך ובכל חזרה אליו (useFocusEffect), כך שאחרי פעולה במסך אחר הנתונים תמיד עדכניים.
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const requestId = useRef(0);

  const run = useCallback(async (silent: boolean) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (id === requestId.current) setData(result); // תשובה ישנה לא דורסת בקשה חדשה יותר
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "אירעה שגיאה. נסו שוב.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => void run(data !== null), [run, ...deps]));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run(true);
    setRefreshing(false);
  }, [run]);

  return { data, setData, error, loading, refreshing, reload: () => run(false), refresh };
}
