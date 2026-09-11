import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/LiquidTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Übersicht' }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
    </Tabs>
  );
}

