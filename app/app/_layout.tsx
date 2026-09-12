import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSymbolFont } from '@/lib/symbolFont';
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
  // Android zeichnet die Icons aus einer Schriftdatei; ohne Vorladen bleibt
  // der erste Frame leer. Auf iOS ist der Aufruf eine leere Zusage.
  useEffect(() => {
    preloadSymbolFont().catch(() => undefined);
  }, []);

  // Der Zoom im Netz-Tab braucht einen Wurzelknoten fuer Gesten. Ohne ihn
  // laufen Pinch und Pan auf Android ins Leere, ohne dass etwas abstuerzt --
  // ein Fehler, den man erst am Geraet bemerkt.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
