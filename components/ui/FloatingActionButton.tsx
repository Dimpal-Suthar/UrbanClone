import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'add',
  size = 32,
  color = 'white',
  backgroundColor,
  position = 'bottom-right',
  style,
}) => {
  const { colors } = useTheme();

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: backgroundColor || colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, bottom: 24, left: 24 };
      case 'bottom-center':
        return { ...baseStyle, bottom: 24, alignSelf: 'center' as const };
      case 'bottom-right':
      default:
        return { ...baseStyle, bottom: 24, right: 24 };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-70"
      style={[
        getPositionStyle(),
        {
          backgroundColor: backgroundColor || colors.primary,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
};
