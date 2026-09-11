import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

function RootNavigator() {
  const { team } = useGameStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.background },
      }}
    >
      <Stack.Protected guard={!team}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!team}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
