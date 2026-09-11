import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/LiquidTabBar';

/**
 * Keine `index.tsx` in dieser Gruppe: Eine Gruppe fügt kein Pfadsegment hinzu,
 * `(tabs)/index.tsx` läge also ebenfalls auf `/` und würde `app/index.tsx`
 * (die Team-Auswahl) beschatten. Deshalb heißt der Start-Tab `overview`.
 */
export const unstable_settings = {
  initialRouteName: 'overview',
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="overview" options={{ title: 'Übersicht' }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
    </Tabs>
  );
}
