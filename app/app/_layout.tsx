import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SlopProvider } from "@/engine/SlopProvider";
import { colors } from "@/theme/tokens";

/**
 * Wurzel-Layout. Das Provider-Paar (Gesture-Handler, SafeArea) und der
 * Simulationskontext umschließen den ganzen Stack, damit jeder Screen auf
 * denselben Spielstand zugreift. Modals kommen als native iOS-Sheets
 * (formSheet), keine selbstgebaute Overlay-Lösung.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SlopProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvasParchment } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="cockpit" />
            <Stack.Screen
              name="quest"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.6, 0.95],
                sheetGrabberVisible: true,
                sheetCornerRadius: 18,
              }}
            />
            <Stack.Screen
              name="fountain/[id]"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.6, 0.95],
                sheetGrabberVisible: true,
                sheetCornerRadius: 18,
              }}
            />
            <Stack.Screen
              name="regie"
              options={{
                presentation: "formSheet",
                sheetAllowedDetents: [0.95],
                sheetGrabberVisible: true,
                sheetCornerRadius: 18,
              }}
            />
          </Stack>
        </SlopProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
