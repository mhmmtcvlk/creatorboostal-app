import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6C5CE7',
    secondary: '#A29BFE',
    tertiary: '#FD79A8',
    surface: '#1A1A1A',
    surfaceVariant: '#2D2D2D',
    background: '#0c0c0c',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: '#404040',
    elevation: {
      level0: 'transparent',
      level1: '#1A1A1A',
      level2: '#2D2D2D',
      level3: '#404040',
      level4: '#4A4A4A',
      level5: '#545454',
    },
  },
};

export const colors = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  accent: '#FD79A8',
  background: '#0c0c0c',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#B8B8B8',
  border: '#404040',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  gradient: {
    primary: ['#6C5CE7', '#A29BFE'],
    secondary: ['#FD79A8', '#FDCB6E'],
    dark: ['#0c0c0c', '#1A1A1A'],
  },
};