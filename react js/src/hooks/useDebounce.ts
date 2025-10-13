import { useState, useEffect } from "react";

export function useDebounce<T>(searchTerm: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);

    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  return debouncedValue;
}
