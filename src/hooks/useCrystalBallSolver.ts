// src/hooks/useCrystalBallSolver.ts
import { useState, useEffect, useMemo } from 'react';
import { SolverState } from '../types/solver';

export function useCrystalBallSolver({ n, secretF }: { n: number; secretF: number }) {
  const [state, setState] = useState<SolverState>({
    sequence: [],
    drops: [],
    foundFloor: null,
    totalDrops: 0,
    finished: false,
  });

  // compute k
  const k = useMemo(() => {
    let kLocal = 0;
    while ((kLocal * (kLocal + 1)) / 2 < n) kLocal++;
    return kLocal;
  }, [n]);

  useEffect(() => {
    if (n <= 0) {
      reset();
      return;
    }
    const seq: number[] = [];
    let step = k;
    let current = step;
    while (current < n && step > 0) {
      seq.push(current);
      step -= 1;
      current += step;
    }
    if (seq.length === 0 && n > 0) seq.push(Math.min(k, n - 1));
    setState({ sequence: seq, drops: [], foundFloor: null, totalDrops: 0, finished: false });
  }, [n, k]);

  const testBreaks = (floor: number) => floor >= secretF;

  const step = (): { action: string; floorTested?: number; broke?: boolean } => {
    if (state.finished) return { action: 'finished' };

    const nextIndex = state.drops.length;
    const pastBreakIndex = state.drops.findIndex((d) => testBreaks(d));

    // phase 1
    if (pastBreakIndex === -1) {
      const firstPhaseIndex = state.drops.length;
      if (firstPhaseIndex < state.sequence.length) {
        const floorToTest = state.sequence[firstPhaseIndex];
        const broke = testBreaks(floorToTest);
        setState((s) => ({
          ...s,
          drops: [...s.drops, floorToTest],
          totalDrops: s.totalDrops + 1,
        }));
        return { action: broke ? 'break' : 'safe', floorTested: floorToTest, broke };
      }
    }

    // phase 2
    const brokeIndex = state.drops.findIndex((d) => testBreaks(d));
    if (brokeIndex !== -1) {
      const breakFloor = state.drops[brokeIndex];
      const prevSafe = brokeIndex === 0 ? -1 : state.drops[brokeIndex - 1];
      const nextLinear = prevSafe + 1 + (state.drops.length - (brokeIndex + 1));
      if (nextLinear <= breakFloor) {
        const broke = testBreaks(nextLinear);
        const newDrops = [...state.drops, nextLinear];
        const newTotal = state.totalDrops + 1;
        if (broke) {
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal, foundFloor: nextLinear, finished: true }));
          return { action: 'found', floorTested: nextLinear, broke: true };
        } else {
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal }));
          return { action: 'linear-safe', floorTested: nextLinear, broke: false };
        }
      }
    }

    setState((s) => ({ ...s, finished: true }));
    return { action: 'finished' };
  };

  const runAll = () => {
    // simplified: run until finished
    let simDrops: number[] = [];
    let found: number | null = null;
    let total = 0;

    for (let i = 0; i < state.sequence.length; i++) {
      const f = state.sequence[i];
      simDrops.push(f);
      total++;
      if (testBreaks(f)) {
        const prevSafe = i === 0 ? -1 : state.sequence[i - 1];
        for (let lin = prevSafe + 1; lin <= f; lin++) {
          simDrops.push(lin);
          total++;
          if (testBreaks(lin)) {
            found = lin;
            break;
          }
        }
        break;
      }
    }

    if (found === null) {
      const lastTested = simDrops.length ? simDrops[simDrops.length - 1] : -1;
      for (let lin = lastTested + 1; lin < n; lin++) {
        simDrops.push(lin);
        total++;
        if (testBreaks(lin)) {
          found = lin;
          break;
        }
      }
    }

    if (found === null) found = n === 0 ? 0 : n - 1;
    setState({ ...state, drops: simDrops, totalDrops: total, foundFloor: found, finished: true });
    return { simDrops, total, found };
  };

  const reset = () => {
    setState({ sequence: [], drops: [], foundFloor: null, totalDrops: 0, finished: false });
  };

  return { state, k, step, runAll, reset };
}