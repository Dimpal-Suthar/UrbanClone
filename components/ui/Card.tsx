import { useTheme } from '@/contexts/ThemeContext';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, ...props }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

