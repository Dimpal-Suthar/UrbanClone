import { View, TextInput, Text, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  leftIcon, 
  rightIcon,
  style,
  ...props 
}: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? colors.error : isFocused ? colors.primary : colors.border;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '500', color: colors.text }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor,
        }}
      >
        {leftIcon && <View style={{ marginRight: 12 }}>{leftIcon}</View>}
        <TextInput
          style={{ 
            flex: 1, 
            fontSize: 16, 
            color: colors.text 
          }}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={{ marginLeft: 12 }}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={{ marginTop: 4, fontSize: 14, color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}

