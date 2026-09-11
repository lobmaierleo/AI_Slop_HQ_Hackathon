import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

function RootNavigator() {
  const { hasStarted, hydrated } = useGameStore();

  // Solange der gespeicherte Fortschritt nicht gelesen ist, wuerde der Guard
  // kurz auf das Onboarding zeigen und sofort wieder wegspringen.
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: THEME.colors.background }} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.background },
      }}
    >
      <Stack.Protected guard={!hasStarted}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={hasStarted}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
