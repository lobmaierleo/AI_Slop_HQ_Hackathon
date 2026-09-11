import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/LiquidTabBar';
import type { LiquidTabBarProps } from '@/components/LiquidTabBar';
import { THEME } from '@/theme/colors';

const SCREEN_OPTIONS = {
  headerShown: false,
  sceneStyle: { backgroundColor: THEME.colors.background },
};

const INDEX_OPTIONS = { title: 'Übersicht' };
const QUESTS_OPTIONS = { title: 'Quests' };
const MAP_OPTIONS = { title: 'Karte' };
const LEADERBOARD_OPTIONS = { title: 'Ranking' };

const renderTabBar = (props: LiquidTabBarProps) => <LiquidTabBar {...props} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS} tabBar={renderTabBar}>
      <Tabs.Screen name="index" options={INDEX_OPTIONS} />
      <Tabs.Screen name="quests" options={QUESTS_OPTIONS} />
      <Tabs.Screen name="map" options={MAP_OPTIONS} />
      <Tabs.Screen name="leaderboard" options={LEADERBOARD_OPTIONS} />
    </Tabs>
  );
}
