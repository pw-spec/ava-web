'use client';
import { useEffect, useRef, useState } from 'react';
import { lerpArray } from './animate';

const DURATION_MS = 500;

/** Smoothly animates the rendered values toward `target` whenever it changes. */
export function useAnimatedScores(target: number[]): number[] {
  const [values, setValues] = useState<number[]>(target);
  const fromRef = useRef<number[]>(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = values;
    startRef.current = null;

    function tick(now: number): void {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min((now - startRef.current) / DURATION_MS, 1);
      setValues(lerpArray(fromRef.current, target, t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // reason: keyed on the serialized target; the animation start is captured via refs
  }, [JSON.stringify(target)]);

  return values;
}
