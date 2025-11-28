import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TabBadgeProps {
  count: number;
  color?: string;
}

/**
 * Reusable badge component for tab icons
 * Shows count with "99+" for numbers over 99
 */
export const TabBadge: React.FC<TabBadgeProps> = ({ count, color }) => {
  const { colors } = useTheme();
  const badgeColor = color || colors.error;

  if (count <= 0) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor,
          borderColor: colors.surface,
        },
      ]}
    >
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

