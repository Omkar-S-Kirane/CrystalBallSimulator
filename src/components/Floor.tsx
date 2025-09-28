// components/Floor.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

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
  const bgAnim = useRef(new Animated.Value(tested ? 1 : 0)).current;

  useEffect(() => {
    if (tested) {
      // animate forward (tested)
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

      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // animate backward (untested)
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [tested]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', broke ? '#fee2e2' : '#fff7ed'],
  });

  return (
    <Animated.View
      style={[
        styles.floor,
        { transform: [{ scale: scaleAnim }], height: floorHeight, backgroundColor },
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
  floorCurrent: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
});
