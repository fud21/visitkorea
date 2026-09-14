import { useEffect, useState } from "react";

export function useApiResource(loader, dependencies, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUsingFallback(false);
    loader()
      .then((response) => {
        if (active) setData(response);
      })
      .catch(() => {
        if (active) {
          setData(fallback);
          setUsingFallback(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, usingFallback };
}
