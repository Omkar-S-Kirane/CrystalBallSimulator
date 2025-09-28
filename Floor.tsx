// components/Floor.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

type FloorProps = {
  floor: number;
  tested: boolean;
  broke: boolean;
  isCurrentTest: boolean;
  height: number;
};

const Floor: React.FC<FloorProps> = ({ floor, tested, broke, isCurrentTest, height }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = default, 1 = tested

  useEffect(() => {
    if (tested) {
      // Pop-in effect (JS driver since bgAnim uses JS too)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: false, // ⚠️ changed to false
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false, // ⚠️ changed to false
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

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', broke ? '#fee2e2' : '#fff7ed'],
  });

  return (
    <Animated.View
      style={{
        height,
        transform: [{ scale: scaleAnim }],
        backgroundColor,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'center',
        paddingLeft: 12,
        borderLeftWidth: isCurrentTest ? 4 : 0,
        borderLeftColor: isCurrentTest ? '#2563eb' : 'transparent',
      }}
    >
      <Text style={{ fontSize: 12 }}>Floor {floor}</Text>
    </Animated.View>
  );
};

export default Floor;
