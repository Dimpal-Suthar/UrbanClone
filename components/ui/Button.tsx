import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string; // Changed to string for icon name
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surface;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const borderStyle = variant === 'outline' ? { borderWidth: 1.5, borderColor: colors.primary } : {};

  return (
    <Pressable
      style={[
        {
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          backgroundColor: getBackgroundColor(),
          minHeight: 48,
        },
        getPadding(),
        borderStyle,
        props.style as any,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} 
              color={getTextColor()} 
              style={{ marginRight: 8 }}
            />
          )}
          <Text 
            style={{ 
              fontWeight: '600', 
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              color: getTextColor()
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

