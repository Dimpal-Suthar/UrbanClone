import { View, ViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  safeArea?: boolean;
  edges?: Edge[];
  usePadding?: boolean;
}

export function Container({ 
  children, 
  safeArea = true, 
  edges = ['top'],
  usePadding = false,
  style,
  ...props 
}: ContainerProps) {
  const { colors } = useTheme();

  const containerStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  if (safeArea) {
    return (
      <SafeAreaView 
        style={[containerStyle, style]} 
        edges={edges}
        {...props}
      >
        <View style={{ flex: 1, paddingHorizontal: usePadding ? 24 : 0 }}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      <View style={{ flex: 1, paddingHorizontal: usePadding ? 24 : 0 }}>
        {children}
      </View>
    </View>
  );
}

