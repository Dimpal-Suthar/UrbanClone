import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StoreProvider } from '@/stores/StoreProvider';

export default function RootLayout() {
  console.log('🏗️ RootLayout - Loading with routes:');
  console.log('🏗️ - index');
  console.log('🏗️ - (tabs)');
  console.log('🏗️ - service/[id]');
  console.log('🏗️ - chat/[id]');
  console.log('🏗️ - tracking');
  console.log('🏗️ - tracking/[id]');
  
  // Terminal log - will show in Metro bundler
  console.warn('🔥 ROOT LAYOUT LOADING - All routes registered');

  return (
    <StoreProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="service/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="tracking" />
        </Stack>
      </ThemeProvider>
    </StoreProvider>
  );
}

