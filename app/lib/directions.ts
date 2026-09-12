import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Uebergibt einen Ort an die Navigations-App des Geraets.
 *
 * Das Festival ist ein Stadtspaziergang, deshalb ueberall der Fussweg-Modus.
 * Wenn die native App fehlt -- etwa auf einem Geraet ohne Google Maps --
 * faengt die Weboberflaeche von Apple Maps den Fall ab, die auch im Browser
 * eine Route zeigt.
 */
export async function openDirections(lat: number, lon: number, label: string): Promise<void> {
  const target = `${lat},${lon}`;
  const query = encodeURIComponent(label);
  const native =
    Platform.OS === 'ios'
      ? `maps://?daddr=${target}&q=${query}&dirflg=w`
      : `google.navigation:q=${target}&mode=w`;
  const web = `https://maps.apple.com/?daddr=${target}&dirflg=w`;

  try {
    await Linking.openURL(native);
  } catch {
    await Linking.openURL(web).catch(() => undefined);
  }
}
