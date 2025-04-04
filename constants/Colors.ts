/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryColor = "#2a9d8f";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#374151",
    background: "#f8fafc",
    tint: primaryColor,
    icon: "#6b7280",
    tabIconDefault: "#9ca3af",
    tabIconSelected: primaryColor,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9ba1a6",
    tabIconSelected: tintColorDark,
  },
};
