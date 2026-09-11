import { Tabs } from 'expo-router';
import { THEME } from '@/theme/colors';

const SCREEN_OPTIONS = {
  headerShown: false,
  sceneStyle: { backgroundColor: THEME.colors.background },
};

const INDEX_OPTIONS = { title: 'Übersicht' };
const QUESTS_OPTIONS = { title: 'Quests' };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="index" options={INDEX_OPTIONS} />
      <Tabs.Screen name="quests" options={QUESTS_OPTIONS} />
    </Tabs>
  );
}
