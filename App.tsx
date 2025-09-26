// App.tsx
// React Native + TypeScript (v5.5+) single-file example for the "Crystal Ball Drop Simulator" challenge.
// Place this file in a new React Native (expo or react-native-cli) TypeScript project as App.tsx.
// ---------------------------------------------------------------------------------------------
// Features implemented:
// - Inputs for n (floors) and secret f (breaking floor)
// - useCrystalBallSolver custom hook encapsulating the two-ball optimal algorithm
// - Visual building (blocks), floor highlighting for each drop, broken ball state
// - Run Simulation, Reset Simulation, and a "Step" mode (Next / Prev) to walk through drops
// - Basic input validation and result display (found floor, total drops, secret f shown at end)
// - TypeScript types and React hooks (useState, useReducer, useRef)
// ---------------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useReducer, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';

// ----------------------------- Types ---------------------------------

type SolverState = {
  sequence: number[]; // floors to drop in order for first-phase drops
  drops: number[]; // actual drop sequence (may include repeated lower-floor linear checks)
  foundFloor: number | null; // determined f
  totalDrops: number; // count
  finished: boolean;
};

// ------------------------ useCrystalBallSolver ------------------------

// This hook encapsulates the algorithm and simulation progression.
// It does NOT read the secret `secretF` directly for the algorithm's decisions
// but the simulation driver (inside hook) will 'test' against secretF to determine
// break/no-break outcomes. The solver exposes a `step()` and `runAll()` to progress.

export function useCrystalBallSolver({
  n,
  secretF,
}: {
  n: number;
  secretF: number; // provided to simulation engine (not 'peeked' by the algorithm)
}) {
  // internal state
  const [state, setState] = useState<SolverState>({
    sequence: [],
    drops: [],
    foundFloor: null,
    totalDrops: 0,
    finished: false,
  });

  // compute optimal step size k such that k*(k+1)/2 >= n
  const k = useMemo(() => {
    let kLocal = 0;
    while ((kLocal * (kLocal + 1)) / 2 < n) kLocal++;
    return kLocal;
  }, [n]);

  // Precompute first-phase drop floors (decreasing step sizes):
  // floors: k, k+(k-1), k+(k-1)+(k-2), ... until >= n
  useEffect(() => {
    if (n <= 0) {
      setState((s) => ({ ...s, sequence: [], drops: [], foundFloor: null, totalDrops: 0, finished: false }));
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
    // ensure last considered point includes n-1 at most
    if (seq.length === 0 && n > 0) seq.push(Math.min(k, n - 1));
    setState((s) => ({ ...s, sequence: seq, drops: [], foundFloor: null, totalDrops: 0, finished: false }));
  }, [n, k]);

  // helper test function: returns true if drop at floor `f` breaks
  const testBreaks = (floor: number) => {
    // floor index semantics: floors are 0..n-1. A drop at floor >= secretF breaks.
    return floor >= secretF;
  };

  // run a single 'step' in the simulation; returns description of action
  const step = (): { action: string; floorTested?: number; broke?: boolean } => {
    if (state.finished) return { action: 'finished' };

    // If no sequence left (rare), finish
    if (state.sequence.length === 0) {
      setState((s) => ({ ...s, finished: true }));
      return { action: 'finished' };
    }

    // If we haven't exhausted the first-phase sequence, pop next
    const nextIndex = state.drops.length;

    // If we're in first phase (we haven't seen a broken drop yet), we should attempt next sequence
    // But we don't know whether a previous drop broke until the simulation records it.
    // We'll model algorithm: drop at floors in `sequence` until a break occurs.

    // Determine next first-phase target: it's either sequence[nextFirstIndex] or if we've already
    // had a break we switch to linear scan between previous safe+1..breachFloor-1

    // Look for the first break already recorded
    const firstBreakDropIndex = state.drops.findIndex((d) => d < 0); // we will encode broken copies as -floor-1000? (we DON'T do that)

    // Simpler: we will store drops as numbers; when a drop breaks we will set a "broken" marker in runtime.
    // For clarity here, we'll inspect past drops against secretF to see if any broke
    const pastBreakIndex = state.drops.findIndex((d) => testBreaks(d));

    // If no past break, continue first-phase drop at sequence[nextFirstPhaseIndex]
    if (pastBreakIndex === -1) {
      const firstPhaseIndex = state.drops.length; // number of first-phase drops so far
      if (firstPhaseIndex < state.sequence.length) {
        const floorToTest = state.sequence[firstPhaseIndex];
        const broke = testBreaks(floorToTest);
        const newDrops = [...state.drops, floorToTest];
        const newTotal = state.totalDrops + 1;
        let finished = false;
        let foundFloor: number | null = null;

        if (broke) {
          // start linear search between previous safe floor (exclusive) +1 up to floorToTest
          // previous safe floor is floorToTest - (remaining step size)
          // compute previous safe floor: if this is firstPhaseIndex 0 -> previous safe = -1
          const prevStep = k - firstPhaseIndex; // remaining step size when we chose this floor
          const previousSafe = floorToTest - prevStep - 1 + 1; // careful math: simpler to compute directly below
          // Simpler approach: previous safe is if firstPhaseIndex === 0 -> -1, else sequence[firstPhaseIndex -1]
          const previousSafeFloor = firstPhaseIndex === 0 ? -1 : state.sequence[firstPhaseIndex - 1];
          // Set state and return; but we don't mark foundFloor until linear scan finishes
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal }));
          return { action: 'break', floorTested: floorToTest, broke: true };
        } else {
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal }));
          return { action: 'safe', floorTested: floorToTest, broke: false };
        }
      }
    }

    // If we reach here, it means a break occurred in an earlier drop and now we must linear-scan
    // Find index of earliest drop that broke
    const brokeIndex = state.drops.findIndex((d) => testBreaks(d));
    if (brokeIndex !== -1) {
      const breakFloor = state.drops[brokeIndex];
      const prevSafeFloor = brokeIndex === 0 ? -1 : state.drops[brokeIndex - 1];
      // linear scan from prevSafeFloor + 1 up to breakFloor (inclusive) to find exact f
      const start = prevSafeFloor + 1;
      // find next floor in linear scan that we haven't tested yet
      const testedLinear = state.drops.slice(brokeIndex + 1); // those are the linear tests we've done
      // next linear candidate is start + testedLinear.length
      const nextLinear = start + testedLinear.length;
      if (nextLinear <= breakFloor) {
        const broke = testBreaks(nextLinear);
        const newDrops = [...state.drops, nextLinear];
        const newTotal = state.totalDrops + 1;
        if (broke) {
          // we found the exact breaking floor
          const foundFloor = nextLinear;
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal, foundFloor, finished: true }));
          return { action: 'found', floorTested: nextLinear, broke: true };
        } else {
          // safe - continue linear scanning
          if (nextLinear === breakFloor) {
            // if we reached the breakFloor and it didn't break, then breaking floor is breakFloor+1? but by definition breakFloor should break
          }
          setState((s) => ({ ...s, drops: newDrops, totalDrops: newTotal }));
          return { action: 'linear-safe', floorTested: nextLinear, broke: false };
        }
      } else {
        // no more in linear range => finish
        setState((s) => ({ ...s, finished: true }));
        return { action: 'finished' };
      }
    }

    // fallback
    setState((s) => ({ ...s, finished: true }));
    return { action: 'finished' };
  };

  // Run until finished, returning the drops list (synchronous loop using testBreaks)
  const runAll = () => {
    // copy local state to simulate
    let simDrops: number[] = [];
    let found: number | null = null;
    let total = 0;

    // First-phase: drop at sequence until break
    for (let i = 0; i < state.sequence.length; i++) {
      const floorToTest = state.sequence[i];
      simDrops.push(floorToTest);
      total++;
      if (testBreaks(floorToTest)) {
        // broken: linear scan between previous safe +1 .. floorToTest
        const prevSafe = i === 0 ? -1 : state.sequence[i - 1];
        for (let lin = prevSafe + 1; lin <= floorToTest; lin++) {
          simDrops.push(lin);
          total++;
          if (testBreaks(lin)) {
            found = lin;
            break;
          }
        }
        break; // done
      }
    }

    // if none of the first-phase broke, then f is >= last tested floor + 1; use linear from last tested +1 to n-1
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

    setState((s) => ({ ...s, drops: simDrops, totalDrops: total, foundFloor: found, finished: true }));
    return { simDrops, total, found };
  };

  const reset = () => {
    setState({ sequence: [], drops: [], foundFloor: null, totalDrops: 0, finished: false });
  };

  return { state, k, step, runAll, reset };
}

// ----------------------------- App UI --------------------------------

export default function App() {
  const [nText, setNText] = useState('10');
  const [fText, setFText] = useState('3');

  const [n, setN] = useState<number>(10);
  const [secretF, setSecretF] = useState<number>(3);

  const [autoRunning, setAutoRunning] = useState(false);

  // Step mode controls
  const [stepIndex, setStepIndex] = useState(0);

  const solver = useCrystalBallSolver({ n, secretF });

  useEffect(() => {
    // keep local n/secretF in sync when inputs validated
  }, [n, secretF]);

  const applyInputs = () => {
    const nn = parseInt(nText, 10);
    const ff = parseInt(fText, 10);
    if (Number.isNaN(nn) || Number.isNaN(ff)) return Alert.alert('Invalid input', 'Please enter valid integers.');
    if (nn <= 0) return Alert.alert('Invalid floors', 'Number of floors must be > 0');
    if (ff < 0 || ff >= nn) return Alert.alert('Invalid breaking floor', '0 <= f < n');
    setN(nn);
    setSecretF(ff);
    solver.reset();
    setStepIndex(0);
  };

  const runSimulation = async () => {
    applyInputs();
    setAutoRunning(true);
    // run the full simulation with small delays to show UI updates
    // We'll call solver.runAll to compute final drops quickly, but we'll animate by stepping through those drops
    const result = solver.runAll();
    const { simDrops } = result;
    for (let i = 0; i < simDrops.length; i++) {
      await new Promise((res) => setTimeout(res, 300));
      setStepIndex((s) => s + 1);
    }
    setAutoRunning(false);
  };

  const resetAll = () => {
    setNText('0');
    setFText('0');
    setN(0);
    setSecretF(0);
    solver.reset();
    setStepIndex(0);
  };

  // Step controls: Next Step will invoke solver.step and increment stepIndex to reveal more drops
  const nextStep = () => {
    if (!solver.state.finished) {
      const r = solver.step();
      setStepIndex((s) => s + 1);
    }
  };

  const prevStep = () => {
    // simple undo for visualization only (doesn't roll back solver state)
    setStepIndex((s) => Math.max(0, s - 1));
  };

  // visibleDrops for UI based on solver.state.drops and stepIndex
  const visibleDrops = solver.state.drops.slice(0, stepIndex);

  // Build floor items (0..n-1) with style based on visibleDrops
  const floors = Array.from({ length: Math.max(0, n) }, (_, i) => i);

  const floorHeight = Math.max(26, Math.floor((Dimensions.get('window').height - 300) / Math.max(1, n)));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crystal Ball Drop Simulator</Text>

      <View style={styles.controlsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Floors (n)</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={nText}
            onChangeText={setNText}
            placeholder="Total floors"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Secret f (0..n-1)</Text>
          <TextInput
            keyboardType="number-pad"
            style={styles.input}
            value={fText}
            onChangeText={setFText}
            placeholder="Secret breaking floor"
          />
        </View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={applyInputs} disabled={autoRunning}>
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={runSimulation} disabled={autoRunning}>
          <Text style={styles.buttonText}>Run Simulation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={resetAll}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepControlsRow}>
        <TouchableOpacity style={styles.smallButton} onPress={prevStep} disabled={stepIndex <= 0}>
          <Text>◀ Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={nextStep} disabled={solver.state.finished && stepIndex >= solver.state.drops.length}>
          <Text>Next ▶</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 12 }}>Step: {stepIndex} / {solver.state.drops.length}</Text>
      </View>

      <View style={styles.resultsRow}>
        <Text style={styles.resultText}>Found f: {solver.state.foundFloor !== null ? solver.state.foundFloor : '—'}</Text>
        <Text style={styles.resultText}>Drops: {solver.state.totalDrops}</Text>
        <Text style={styles.resultText}>Secret f: {solver.state.finished ? secretF : '—'}</Text>
      </View>

      <View style={styles.buildingContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {floors
            .slice()
            .reverse()
            .map((floor) => {
              const tested = visibleDrops.includes(floor);
              const broke = visibleDrops.includes(floor) && floor >= secretF;
              const isCurrentTest = solver.state.drops[visibleDrops.length - 1] === floor && !solver.state.finished;
              return (
                <View
                  key={floor}
                  style={[
                    styles.floor,
                    { height: floorHeight },
                    tested && styles.floorTested,
                    broke && styles.floorBroken,
                    isCurrentTest && styles.floorCurrent,
                  ]}
                >
                  <Text style={styles.floorText}>Floor {floor}</Text>
                </View>
              );
            })}
        </ScrollView>
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 12, color: '#444' }}>
          Algorithm: uses the optimal two-ball strategy — choose step k so that k*(k+1)/2 ≥ n; drop at floors k, k+(k-1), …;
          when a break occurs, linearly scan lower segment. This minimizes worst-case drops.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 12 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginVertical: 8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  inputGroup: { flex: 1, marginHorizontal: 6 },
  label: { fontSize: 12, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginTop: 6, backgroundColor: '#fff' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  button: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  stepControlsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 6 },
  smallButton: { borderWidth: 1, borderColor: '#aaa', padding: 6, marginRight: 8, borderRadius: 6, backgroundColor: '#fff' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 6 },
  resultText: { fontWeight: '600' },
  buildingContainer: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  floor: { borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'center', paddingLeft: 12 },
  floorText: { fontSize: 12 },
  floorTested: { backgroundColor: '#fff7ed' },
  floorBroken: { backgroundColor: '#fee2e2' },
  floorCurrent: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
});
