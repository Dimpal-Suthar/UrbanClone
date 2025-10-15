import { useTheme } from '@/contexts/ThemeContext';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const { colors } = useTheme();

  const shadowStyle = variant === 'elevated' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } : {};

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 0.5,
          borderRadius: 16,
          padding: 16,
        },
        shadowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

