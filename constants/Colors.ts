export const Colors = {
  light: {
    primary: '#FF6B35',
    primaryLight: '#FF8A5C',
    primaryDark: '#E55520',
    secondary: '#004E89',
    secondaryLight: '#1E88E5',
    background: '#FFFFFF',
    surface: '#F7F7F7',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  },
  dark: {
    primary: '#FF6B35',
    primaryLight: '#FF8A5C',
    primaryDark: '#E55520',
    secondary: '#1E88E5',
    secondaryLight: '#42A5F5',
    background: '#1A1A1A',
    surface: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: '#3A3A3A',
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',
  },
};

export type ColorScheme = keyof typeof Colors;

