import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as Location from 'expo-location';

export type UserPosition = { lat: number; lon: number };

const PositionContext = createContext<UserPosition | null>(null);

/**
 * Der eigene Standort, genau einmal fuer die ganze App.
 *
 * Bewusst ein Provider und kein Hook mit eigenem Effekt: `QuestDetailSheet`
 * haengt in drei Screens gleichzeitig, und jede Instanz haette sonst ihren
 * eigenen `watchPositionAsync` aufgemacht. Mehrere Beobachter nebeneinander
 * kosten nicht nur Akku -- sie rendern die Kartenseite waehrend einer Pinch-
 * Geste neu, und die Karte laesst sich dann nicht mehr zoomen.
 *
 * Ohne Freigabe bleibt der Wert `null`. Jede Aufrufstelle laesst ihre
 * Entfernungsangabe dann einfach weg, statt eine Fehlermeldung zu zeigen.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<UserPosition | null>(null);

  useEffect(() => {
    let stop: Location.LocationSubscription | undefined;
    let alive = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive || status !== 'granted') return;
      stop = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15 },
        ({ coords }) => setPosition({ lat: coords.latitude, lon: coords.longitude }),
      );
    })().catch(() => undefined);

    return () => {
      alive = false;
      stop?.remove();
    };
  }, []);

  return <PositionContext.Provider value={position}>{children}</PositionContext.Provider>;
}

export function useUserLocation(): UserPosition | null {
  return useContext(PositionContext);
}
