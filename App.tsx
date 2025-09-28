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
  Animated,
} from 'react-native';
import Floor from './src/components/Floor';
import { useCrystalBallSolver } from './src/hooks/useCrystalBallSolver';

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
    const result = solver.step();
    setStepIndex((s) => s + 1);
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
        <TouchableOpacity style={styles.smallButton} onPress={nextStep} disabled={stepIndex >= solver.state.drops.length}>
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
                <Floor key={floor} floor={floor} tested={tested} broke={broke} isCurrentTest={isCurrentTest} floorHeight={floorHeight} />
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
