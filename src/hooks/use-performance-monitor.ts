import { useEffect, useRef } from "react";

export function usePerformanceMonitor(label: string, dependency: any) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, [dependency]);

  useEffect(() => {
    if (startTimeRef.current > 0) {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      startTimeRef.current = 0;
    }
  });

  return null;
}