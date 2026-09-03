# Ideensammlung

Breit gesammelt, nicht entschieden. Die Auswahl fällt am Kick-off zu zweit.

Zwei Filter liegen über allem:
- **Verbrannt** sind Umkreissuche, Tagesplaner, Kalender und Programm-Chatbot — das sind die vier offiziellen Beispielprojekte. Wer das baut, baut das Handout nach.
- **Gewertet** wird per Community Voting nach Idee, Kreativität, Originalität, Umsetzung und der Verschränkung beider Datenwelten. Jede Idee unten steht oder fällt mit der Frage: *Warum klickt jemand nach 40 Sekunden Pitch auf uns?*

Legende: **Aufwand** in Netto-Stunden von 13 verfügbaren · **Risiko** ⬤ hoch ◐ mittel ○ niedrig

---

## A · Namen und Erinnerung

Der Straßennamen-Datensatz ist unser stärkstes Material und mit Abstand das, was am wenigsten Teams anfassen werden — er sieht auf den ersten Blick wie eine Liste aus.

**A1 · 53 zu 399**
Linz hat 399 Straßen nach Männern benannt und 53 nach Frauen. Eine Karte der ganzen Stadt, eingefärbt nach Geschlecht — das Bild allein ist der Pitch. Dann der Dreh: Die 511 Festival-Künstler:innen stehen als Vorschläge bereit, und Besucher:innen können eine Straße live umbenennen. Die Umbenennungen sammeln sich öffentlich an; am Ende des Tages hat das Publikum eine zweite Stadt gebaut.
*Daten:* strassennamen + contacts · *Aufwand:* 8h · *Risiko:* ○ · *Voting:* partizipativ — wer selbst eine Straße umbenannt hat, erinnert sich beim Abstimmen.

**A2 · Die Umbenennung 1938 / 1945 / heute**
364 historische Straßennamen, darunter `Adolf-Hitler-Platz` und die NS-Umbenennungen von 1938–41 mit ihrer Rückbenennung. Ein Zeitregler über der Stadt. An jeder umbenannten Straße wird ein Festivalprojekt gepinnt, das von Erinnerung, Auslöschung oder Geschichtsschreibung handelt. Linz hat seine Namen dreimal neu verhandelt — das Festival heißt *Negotiating Humanity*.
*Daten:* strassennamen historisch + projects (semantisch) · *Aufwand:* 9h · *Risiko:* ◐ · *Voting:* inhaltlich das Schwerste; in Linz mit seiner NS-Geschichte auch das Mutigste. Braucht sorgfältigen Ton.

**A3 · Der Namensgeber trifft die Künstlerin**
Die Straßennamen tragen Berufe: 57 Politiker, 45 Schriftsteller, 35 Maler, 25 Komponisten. Jede Person wird mit einer heute in Linz ausstellenden Künstler:in gepaart, die dasselbe Feld bespielt. Ein Komponist von 1890 begegnet einer Klangkünstlerin von 2026 an *seiner* Straße. Zwei Biografien nebeneinander, 136 Jahre auseinander.
*Daten:* strassennamen + contacts + projects · *Aufwand:* 7h · *Risiko:* ○ · *Voting:* elegant und sofort verständlich, aber ruhig — kein lautes Projekt.

**A4 · Die namenlosen Straßen**
759 der 1.211 Straßen haben kein `benannt_nach`-Feld. Wer oder was steckt dahinter? Eine Karte der Leerstellen im städtischen Gedächtnis.
*Daten:* strassennamen · *Aufwand:* 5h · *Risiko:* ○ · *Voting:* zu leise für sich allein, gutes Nebenkapitel zu A1/A2.

## B · Herkunft und Zugehörigkeit

**B1 · Wer stellt aus, wer reist an**
`contacts.Country` (107 Länder) joint per ISO-2-Code direkt auf die Tourismusstatistik. Zwei Weltkarten übereinander: Aus welchen Ländern kommt die Kunst — und aus welchen die Gäste? Die Differenz ist das Werk. Länder, die in Linz ausstellen, aber nie hierher reisen. Und umgekehrt.
*Daten:* contacts + herkunftslaender-gaeste · *Aufwand:* 6h · *Risiko:* ○ · *Voting:* die technisch sauberste Verschränkung beider Welten — ein gemeinsamer Schlüssel, kein Trick. Genau das, was das Kriterium verlangt.

**B2 · Der Festival-Fußabdruck**
107 Herkunftsländer ergeben Flugkilometer. Das Festival über Zukunft und Verantwortung erzeugt eine berechenbare Menge CO₂. Dagegen steht der Baumkataster: 27.004 Linzer Bäume mit Höhe, Stammumfang und Art — also mit schätzbarer Bindungsleistung. Die Frage auf der Bühne: *Wie viele Linzer Bäume braucht dieses Festival?*
*Daten:* contacts + baumkataster · *Aufwand:* 7h · *Risiko:* ◐ (Schätzmodell muss ehrlich ausgewiesen sein) · *Voting:* eine einzige harte Zahl, die hängen bleibt. Der beste Pitch-Satz im ganzen Dokument.

**B3 · Sprachlos**
265 Projekte laufen auf Englisch, 29 auf Deutsch, 43 sind nonverbal, genau 2 bieten Gebärdensprache. Ein Festival in Österreich, das überwiegend nicht auf Deutsch spricht. Wer ist eingeladen, wer nicht?
*Daten:* projects.Language · *Aufwand:* 4h · *Risiko:* ○ · *Voting:* starke These, dünne Datenbasis für ein ganzes Projekt.

## C · Nicht-menschliche Stimmen

**C1 · 27.004 Zeugen**
Aus dem Stammumfang lässt sich das Alter eines Baumes schätzen. Manche Linzer Bäume standen 1938 schon. Sie werden zu Zeitzeugen: Ein Baum an einer 1938 umbenannten Straße hat den alten und den neuen Namen erlebt. Man wählt einen Baum und bekommt, was er gesehen hat — die Straße unter ihm, ihre Namen, und das Festivalprojekt von heute, das davon handelt.
*Daten:* baumkataster + strassennamen historisch + projects · *Aufwand:* 10h · *Risiko:* ◐ · *Voting:* das poetischste Konzept der Liste und tief im Festivalthema. Anspruchsvoll in der Umsetzung.

**C2 · Der Verhandlungstisch**
Jeder Datensatz bekommt eine Stimme. Der Baumkataster, die Luftgüte-Messwerte, die Radverkehrszählung, die Baulandreserven — vier KI-Agenten, die eine reale Stadtfrage gegeneinander verhandeln, jeder mit echten Messwerten als Beleg. Moderiert von einem Festivalprojekt, das inhaltlich passt. Am Ende stimmt das Publikum ab, wer recht hatte.
*Daten:* mehrere Linz-Datensätze + projects · *Aufwand:* 11h · *Risiko:* ⬤ (LLM-Calls im Demo-Pfad, eigener API-Key nötig, Latenz auf der Bühne) · *Voting:* der spektakulärste Pitch — und der, der live am ehesten hängt. Nur mit vorberechneten Debatten machbar.

**C3 · Was Linz zählt**
Die Stadt kennt 27.004 Bäume einzeln, mit Art und Umfang. Menschen kommen in ihren Daten fast nur als *Ankünfte und Übernachtungen nach Herkunftsland* vor. Eine Bestandsaufnahme dessen, was zählbar gemacht wurde — und was nicht.
*Daten:* alle Linz-Datensätze als Meta-Ebene · *Aufwand:* 6h · *Risiko:* ○ · *Voting:* kluge These, aber statisch. Nichts zum Anfassen.

## D · Körper, Zugang, Ausschluss

**D1 · Die Festival-Blase**
Alle 156 Festivalorte liegen in vier Zonen: Danube Triangle, OK Quarter, Med Campus, Satellite Locations. Wir zeichnen das Gegenteil — den Teil von Linz, den das Festival nicht berührt. Und füllen ihn mit dem, was dort tatsächlich ist: Bäume, Spielplätze, Hundezonen, Straßen mit Namen von Männern. Die Stadt, die währenddessen einfach weiterlebt.
*Daten:* locations + beliebige Linz-Geodaten · *Aufwand:* 6h · *Risiko:* ○ · *Voting:* ein Bild, das sofort sitzt, und eine unbequeme Frage an das eigene Publikum.

**D2 · Wer kann überhaupt kommen**
68 öffentliche WCs mit `barrierefrei`, `eurokey` und `wickeltisch`. Festival-Locations mit Accessibility-Hinweisen in `Additional Info`. Kurzparkzonen, Haltestellen. Ein Festivalbesuch aus Sicht eines Körpers, der nicht der Standardkörper ist.
*Daten:* wc-anlagen + locations + efa + kurzparkzonen · *Aufwand:* 8h · *Risiko:* ◐ · *Voting:* haltungsstark und wirklich nützlich, aber nah am „Tagesplaner"-Muster der Beispielprojekte.

**D3 · Durst**
132 Brunnen in Linz — aber das Feld `trinkwasser` ist bei vielen `false`. Zierbrunnen, die aussehen wie Trinkwasser. Im September, im Festivaltrubel.
*Daten:* trinkbrunnen + locations · *Aufwand:* 3h · *Risiko:* ○ · *Voting:* zu klein, und `whats-near-me` macht es schon.

## E · Mensch oder Maschine

**E1 · Das 887. Projekt**
886 echte Festivalprojekte. Wir erzeugen ein 887., das nicht existiert — mit Titel, Künstler:in, Beschreibung und einem realen Linzer Ort. Dem Publikum werden Projekte gezeigt, eines davon ist erfunden. Erkennst du es? Highscore, direkt am Handy, 30 Sekunden pro Runde.
Das ist *Negotiating Humanity* als Spielmechanik: Kannst du noch unterscheiden, was ein Mensch gemacht hat?
*Daten:* projects + locations + Linz-Geodaten für die Verortung · *Aufwand:* 7h · *Risiko:* ◐ (Fakes müssen vorberechnet sein, kein Live-LLM) · *Voting:* stärkstes Voting-Profil der ganzen Liste — spielbar, kompetitiv, in einem Satz erklärt, und das Publikum spielt gegeneinander, während wir pitchen.

**E2 · Die Straßenumbenennung, verhandelt**
Jede Straße bekommt ein Verfahren. Aus der Biografie der namensgebenden Person generiert ein Modell Pro und Contra einer Umbenennung. Das Publikum urteilt. Die Urteile sammeln sich.
*Daten:* strassennamen + Wikidata · *Aufwand:* 8h · *Risiko:* ⬤ (heikel im Ton, LLM urteilt über reale historische Personen) · *Voting:* aufregend, aber ein Fehlgriff im Ton ist hier teuer.

## F · Zeit

**F1 · Palimpsest**
Historische Stadtpläne von 1876 und 1945, Orthofotos von 1988 bis 2023, darüber die 156 Festivalorte. Ein Zeitregler. Was war 1945 dort, wo heute über künstliche Intelligenz gesprochen wird?
*Daten:* historische-stadtplaene + orthofotos + locations · *Aufwand:* 9h · *Risiko:* ⬤ (Georeferenzierung großer TIFFs, Datei-Downloads noch offen) · *Voting:* visuell großartig, technisch die riskanteste Idee.

**F2 · Der Schatten der Highlights**
22 Projekte sind als `Curatorial Highlight` markiert. 779 Zeitslots. Welche Arbeit läuft immer parallel zu einem Highlight und wird deshalb kaum jemand sehen? Ein Ranking der übersehenen Kunst — und ein Guide, der nur die Verlierer der Programmplanung zeigt.
*Daten:* calendar + projects · *Aufwand:* 5h · *Risiko:* ○ · *Voting:* wunderbar respektlos gegenüber dem eigenen Festival, das kommt bei diesem Publikum an. Nutzt aber nur eine Datenwelt — braucht eine Linz-Ebene dazu.

**F3 · Wenn das Festival schläft**
Festivalzeiten gegen Linztermine: Was tut die Stadt zwischen 18:00 und 09:30?
*Daten:* calendar + linztermine · *Aufwand:* 5h · *Risiko:* ○

## G · Kleinere Funken

- **G1 Datenschatten** — 42.790 kaputte Ortsverweise im Festivalkalender. Der Datensatz weiß nicht, wo seine Veranstaltungen stattfinden. Ein Werk über das, was Systeme nicht wissen.
- **G2 Die Einsamen** — Kontakte mit genau einem Projekt, ohne Website, ohne Instagram. Die unsichtbaren Teilnehmenden des Festivals.
- **G3 Nonverbal** — ein Guide ausschließlich durch die 43 nonverbalen Arbeiten, für Besucher:innen ohne Deutsch und ohne Englisch.
- **G4 Hundezone trifft Kunstzone** — die Überlagerung von Freilaufflächen und Ausstellungsorten, ernsthaft ausgeführt.
- **G5 Bodenfrage** — Baulandreserven gegen Festivalorte: Was Linz noch werden könnte, gegen das, was es diese Woche ist.
- **G6 Luftgüte-Reaktiv** — die Live-Messwerte der fünf Stationen steuern Farbe und Bewegung der ganzen Anwendung. Als Schicht über jeder anderen Idee einsetzbar.
- **G7 Der 12. September** — was an diesem Datum in Linz historisch geschah, an jedem Festivalort.
- **G8 Was niemand fragen kann** — Fragen, die keiner der 23 Datensätze beantwortet. Der Katalog der Leerstellen.

---

## Einschätzung, ohne Entscheidung

Nach Voting-Profil führen drei Kandidaten, aus unterschiedlichen Gründen:

**E1 · Das 887. Projekt** hat das beste Verhältnis aus Wirkung und Risiko. Es ist spielbar, in einem Satz erklärt, trifft das Festivalthema frontal und beschäftigt das Publikum, während wir sprechen. Schwächster Punkt: die Linz-Datenwelt ist nur über die Verortung eingebunden — das müsste bewusst vertieft werden, sonst leidet das Hauptkriterium.

**A1 · 53 zu 399** ist das stärkste Bild plus Partizipation. Die Zahl steht am Anfang des Pitches und sitzt sofort. Beide Datenwelten sind echt verschränkt: Linzer Straßen, Festival-Künstlerinnen. Und wer selbst eine Straße umbenannt hat, hat einen Grund, für uns zu stimmen.

**B1 · Wer stellt aus, wer reist an** ist die sauberste Antwort auf das Bewertungskriterium überhaupt — ein echter gemeinsamer Schlüssel zwischen den Welten statt einer semantischen Näherung. Dafür ruhiger als die beiden anderen.

Reizvoll wäre eine Kombination: **A1 als Anwendung, B2 als Zahl im Pitch.** Vor der Entscheidung sollten wir aber gegeneinander abwägen, ob wir laut (E1), politisch (A1/A2) oder analytisch (B1) auftreten wollen — das lässt sich nicht gleichzeitig haben.
