// components/Floor.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

type FloorProps = {
  floor: number;
  tested: boolean;
  broke: boolean;
  isCurrentTest: boolean;
  floorHeight: number;
};

const Floor: React.FC<FloorProps> = ({
  floor,
  tested,
  broke,
  isCurrentTest,
  floorHeight,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = default, 1 = tested

  useEffect(() => {
    if (tested) {
      // Pop-in effect (JS driver since bgAnim uses JS too)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();

      // Background fade animation
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [tested]);

  return (
    <Animated.View
      key={floor}
      style={[
        styles.floor,
        { transform: [{ scale: scaleAnim }] },
        { height: floorHeight },
        tested && styles.floorTested,
        broke && styles.floorBroken,
        isCurrentTest && styles.floorCurrent,
      ]}
    >
      <Text style={styles.floorText}>Floor {floor}</Text>
    </Animated.View>
  );
};

export default Floor;

const styles = StyleSheet.create({
  floor: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  floorText: { fontSize: 12 },
  floorTested: { backgroundColor: '#fff7ed' },
  floorBroken: { backgroundColor: '#fee2e2' },
  floorCurrent: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
});
