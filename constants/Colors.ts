/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  // Standardized App Palette
  palette: {
    primary: '#f4511e', // Deep Orange
    secondary: '#3498db', // Blue
    success: '#2ecc71', // Green
    warning: '#f1c40f', // Yellow
    danger: '#e74c3c', // Red
    neutral: '#95a5a6', // Grey
    background: '#f8f9fa', // Light Grey Background
    card: '#ffffff', // White Card
    textPrimary: '#2c3e50', // Dark Blue/Grey Text
    textSecondary: '#7f8c8d', // Muted Text
  }
};
