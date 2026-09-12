import { Directory, File, Paths } from 'expo-file-system';

const FOLDER = 'quest-photos';

function photoDir(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Legt das Beweisfoto dauerhaft ab und gibt die neue URI zurueck.
 *
 * `expo-camera` schreibt in den Cache, und den raeumt iOS ohne Vorwarnung.
 * Im Dokumentverzeichnis ueberlebt das Bild jeden Neustart -- der Beweis ist
 * der halbe Spielstand, er darf nicht verschwinden. Eine Quest hat genau ein
 * Foto, deshalb ist die Quest-ID der Dateiname und ein zweiter Versuch
 * ueberschreibt den ersten.
 */
export async function savePhoto(questId: string, tempUri: string): Promise<string> {
  const target = new File(photoDir(), `${questId}.jpg`);
  if (target.exists) target.delete();
  new File(tempUri).copy(target);
  return target.uri;
}

/** Raeumt beim Zuruecksetzen des Fortschritts alle Bilder mit weg. */
export async function clearPhotos(): Promise<void> {
  const dir = new Directory(Paths.document, FOLDER);
  if (dir.exists) dir.delete();
}
