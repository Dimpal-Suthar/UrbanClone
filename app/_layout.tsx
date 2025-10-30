import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/stores/StoreProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryProvider>
      <StoreProvider>
        <ThemeProvider>
          <NotificationProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth/email" />
              <Stack.Screen name="auth/profile" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(provider)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="provider/apply" />
              <Stack.Screen name="provider/[id]" />
              <Stack.Screen name="service/[id]" />
              <Stack.Screen name="service/professionals/[id]" />
              <Stack.Screen name="service/reviews/[id]" />
              <Stack.Screen name="chat/[id]" />
            </Stack>
            <Toast />
          </NotificationProvider>
        </ThemeProvider>
      </StoreProvider>
    </QueryProvider>
  );
}

