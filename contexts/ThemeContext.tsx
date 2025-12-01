import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, useColorScheme as useSystemColorScheme, View } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@urban_clone_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  // Start with system theme immediately (no delay)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Use system theme as initial state for instant rendering
    return 'system';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme on app start (non-blocking)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setIsInitialized(true);
        // Hide splash screen once theme is initialized and component can render
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {
            // Ignore errors
          });
        }, 100);
      }
    };
    // Load in background, don't block rendering
    loadTheme();
  }, []);

  // Save theme when it changes (optimistic update - update UI immediately, save in background)
  const setThemeMode = (mode: ThemeMode) => {
    // Update state immediately for instant UI response
    setThemeModeState(mode);
    // Save to storage in background (non-blocking)
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      console.log('Error saving theme:', error);
      // If save fails, revert to previous theme (optional - you can remove this if you want)
    });
  };

  // Determine if dark mode should be active (memoized for performance)
  // This will automatically update when systemColorScheme changes
  const isDark = useMemo(() => {
    return themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  }, [themeMode, systemColorScheme]);

  // Memoize colors to prevent unnecessary re-renders
  const colors = useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);

  // Show loading screen with system theme while initializing (instead of null)
  // This prevents flash and provides better UX
  if (!isInitialized) {
    const systemIsDark = systemColorScheme === 'dark';
    const loadingColors = systemIsDark ? Colors.dark : Colors.light;
    return (
      <View style={{ flex: 1, backgroundColor: loadingColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={loadingColors.primary} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
