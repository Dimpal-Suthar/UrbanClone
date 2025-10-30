import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animate(dot1, 0);
    const animation2 = animate(dot2, 200);
    const animation3 = animate(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {userName && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginRight: 8,
            }}
          >
            {userName} is typing
          </Text>
        )}
        
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          {[dot1, dot2, dot3].map((dot, index) => (
            <Animated.View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.textSecondary,
                marginHorizontal: 2,
                opacity: dot,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

