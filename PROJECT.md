# AufräumHelden – PROJECT.md

**Version:** 1.0 · **Stand:** 11. Oktober 2026 · **Status:** Umsetzungsauftrag für MVP

> Diese Spezifikation ist als direkt nutzbarer Auftrag für ein KI-Coding-Tool gedacht. Implementiere den MVP vollständig, statt nur Mockups zu erzeugen. Halte Entscheidungen unter „Verbindlich“ ein. Wo Details nicht historisch entschieden sind, gelten die als **MVP-Vorgabe** gekennzeichneten Annahmen; dokumentiere Abweichungen.

## 1. Produktvision

AufräumHelden macht das reale Aufräumen eines Kinderzimmers zu einem kurzen, positiven Spiel. Das Zimmer ist das Spielfeld, die App ist der Spielleiter. Kinder erhalten durch ein animiertes Glücksrad konkrete Aufgaben, erledigen sie ausserhalb des Bildschirms und bekommen eine positive Rückmeldung. Einfache Solo-, Kooperations- und Wettkampfmodi sind vorgesehen. **Keine täglichen Streaks oder verpflichtenden Tagesziele.**

**Zielgruppe (MVP-Annahme):** Kinder ca. 5–12 Jahre, mit oder ohne Begleitung durch Erwachsene. **Sprache:** Deutsch. **Produktname:** AufräumHelden. **Slogan:** „Aufräumen macht Spaß“ (Schreibweise bewusst wie historisch verwendet).

## 2. Nachvollziehbarkeit der Entscheidungen

### Verbindlich aus bisherigem Konzept und aktuellen Antworten
- Name „AufräumHelden“, Superhelden-/Spielzeugwelt, visuell freundliche Neonakzente Blau, Gelb, Pink, dunkler Hintergrund; Teddy mit Cape, spielerische Baustein-/Tetris-Anmutung.
- **Einfacher Startbildschirm** mit genau einem dominanten CTA „Modus auswählen“; kein überladenes Dashboard.
- Modi: Allein, Gemeinsam, Wettkampf.
- Wettkampf umfasst **abwechselnde** und **gleichzeitige** Variante.
- **Maximal zwei Kinder** spielen mit; im Solo-Modus eines.
- Erledigung wird **einstellbar** durch das Kind selbst oder durch eine erwachsene Person bestätigt.
- Auswahl der Challenges über ein **Glücksrad** (kein primärer Zufallsbutton).
- Punkte, Münzen und Abzeichen sind Bestandteil des Konzepts. Münzen werden vorerst **nur gesammelt**; Verwendungszweck offen.
- Kein tägliches Ziel; optionales Wochenziel erst in späterer Phase.
- Langfristige Vision: aufgeräumtes Zimmer als Referenz erfassen, später Zustand vergleichen und Unordnung per AR markieren. **Nicht im MVP implementieren.**

### MVP-Vorgaben (neu spezifiziert, nicht als frühere Nutzerentscheidungen ausgeben)
- Ein Gerät, kein Online-Multiplayer, keine Anmeldung, lokale Speicherung.
- Punktevergabe ist bewusst simpel und transparent; keine automatische Überwachung des Zimmers.
- Belohnungen werden nach Bestätigung gutgeschrieben; kein Abzug für Zeitüberschreitungen.
- Elternbestätigung wird ohne PIN umgesetzt, da kein manipulationssicheres System versprochen wird.
- Standard-Session: fünf Challenges; einstellbar auf 3, 5 oder 7.
- Keine Käufe, Werbung, Push-Nachrichten oder Analytics.

## 3. User Journeys und Navigation

### 3.1 Start
- Bildschirm mit Logo/Illustration, Titel, Slogan und **einem grossen primären Button „Modus auswählen“**.
- Optional kleiner, nicht dominanter Link „Einstellungen“; keine Profile, Statistiken oder Sekundäraktionen im Vordergrund.
- Klick führt zu Moduswahl.

### 3.2 Moduswahl
- Drei grosse Karten: „Allein“, „Gemeinsam“, „Wettkampf“.
- Bei „Wettkampf“ Unterauswahl: „Abwechselnd“ und „Gleichzeitig“.
- Bei „Gemeinsam“ genau zwei Kinder, bei „Wettkampf“ genau zwei Kinder, bei „Allein“ ein Kind.
- Weiter zum Setup.

### 3.3 Spielvorbereitung
- Spielernamen: voreingestellt „Held 1“ und „Held 2“; optional anpassbar; maximale Länge 20 Zeichen; Text escapen.
- Auswahl Bestätigung: „Ich bestätige selbst“ oder „Erwachsene bestätigen“ (für die ganze Session).
- Challenge-Anzahl 3 / 5 / 7 (Standard 5).
- Für Gleichzeit-Modus muss dieselbe Challenge für beide Spieler gelten, damit die Wertung nachvollziehbar bleibt.
- Startbutton „Los geht’s!“.

### 3.4 Challenge-Zyklus
1. Glücksrad zeigt passende Challenges und wird per Button „Rad drehen“ gestartet.
2. Animation dauert ca. 2–3 Sekunden; Ergebnis wird **vor** der Animation zufällig aus gültigen Aufgaben gezogen; die visuelle Endposition muss zum Ergebnis passen.
3. Challenge-Karte zeigt Titel, kurze Anweisung, passende Illustration/Icon, Zeitvorschlag und Startbutton.
4. Timer zählt herunter; Pause/Fortsetzen und „Ohne Zeitlimit weitermachen“ möglich.
5. Erledigung bestätigen: bei Selbstbestätigung „Geschafft!“; bei Erwachsenenbestätigung „Erwachsene bestätigen“ mit explizitem Bestätigungsdialog („Ist die Aufgabe erledigt?“). Keine behauptete Identitätsprüfung.
6. Punkte und Münzen werden **erst nach Bestätigung** vergeben. Ergebnisanimation und nächste Challenge.
7. Nach eingestellter Anzahl Aufgaben: Ergebnisbildschirm mit Punkten, Münzen und Abzeichen, „Noch eine Runde“ und „Zum Start“.

## 4. Spielmodi und Wertung

### 4.1 Allein
- Ein Spieler löst nacheinander 3/5/7 Challenges.
- **MVP-Wertung:** bestätigte Challenge = 10 Punkte + 1 Münze; keine Zeitboni und keine Strafpunkte.
- Abzeichen (MVP): „Erster Einsatz“ nach erster bestätigter Challenge; „AufräumHeld“ nach vollständiger Session. Abzeichen nur einmal je Spielerprofil vergeben.

### 4.2 Gemeinsam
- Zwei Spieler arbeiten an derselben Aufgabe. Eine gemeinsame Bestätigung schliesst die Challenge ab.
- **MVP-Wertung:** gemeinsamer Sessionstand +10 Punkte und +1 Münze pro bestätigter Challenge. Anzeige klar als **Teamkonto**, nicht doppelt je Kind.
- Bei Abschluss gemeinsames Erfolgsbild; kein Sieger.

### 4.3 Wettkampf – abwechselnd
- Zwei Spieler sind nacheinander an der Reihe. Reihenfolge alterniert strikt: Held 1, Held 2, Held 1 …
- **MVP-Vorgabe:** Eingestellte Challenge-Anzahl gilt **pro Spieler**, damit beide gleich viele Aufgaben erhalten.
- Für jeden Zug eigenes Glücksrad, eigener Timer und eigene Bestätigung.
- Jede bestätigte Challenge = 10 Punkte + 1 Münze für den aktiven Spieler.
- Nicht erledigte Aufgabe darf über „Überspringen“ mit 0 Punkten abgeschlossen werden; Dialog zur Bestätigung. Ein Überspringen zählt als Zug.
- Gewinner: höhere Punktzahl; bei Gleichstand „Unentschieden“.

### 4.4 Wettkampf – gleichzeitig
- Zwei Spieler erhalten **dieselbe** Challenge und beginnen gleichzeitig.
- Der Timer läuft gemeinsam. Nach Start gibt es je Spieler einen separaten „Geschafft“-Status; beide können unabhängig voneinander bestätigt werden.
- **MVP-Wertung:** jeder Spieler erhält 10 Punkte + 1 Münze bei bestätigter Erledigung; keine Zusatzpunkte für schnelleres Fertigwerden. Ein Zeitablauf beendet die Aufgabe nicht automatisch; „Weiter ohne Zeitlimit“ ist möglich.
- Die nächste Challenge beginnt erst, wenn für beide Spieler ein Abschlussstatus vorliegt (bestätigt oder übersprungen).
- Eingestellte Challenge-Anzahl bedeutet Anzahl gemeinsamer Runden.
- Gewinner nach Gesamtpunkten; Gleichstand möglich. Dieses Modell priorisiert Fairness und geringe Komplexität gegenüber einem echten Geschwindigkeitsrennen.

### 4.5 Allgemeine Regeln
- Keine negativen Punkte, keine Bestrafung und kein öffentlicher Leistungsvergleich.
- Zufallsauswahl wiederholt eine Aufgabe möglichst nicht, bevor alle geeigneten Aufgaben einmal erschienen sind; nach Erschöpfung Pool zurücksetzen.
- Eine abgeschlossene Challenge darf bei mehrfachen Klicks nicht doppelt gutgeschrieben werden (**idempotente** Buchung).
- Zeitüberschreitung ist kein Scheitern. Pause stoppt die Zeit korrekt; Hintergrundwechsel darf nicht zu falscher Punktevergabe führen.
- Bestätigungstyp kann im Setup gewählt werden; während einer laufenden Session nicht versehentlich wechseln.

## 5. Challenge-Daten

Strukturiertes JSON/TypeScript-Datenmodell; nicht in UI-Komponenten hartcodieren.

Beispielkatalog für MVP (alle **neu vorgeschlagen**, redaktionell anpassbar):

| ID | Titel | Aufgabe | Sekunden | Modi |
|---|---|---|---:|---|
| blocks | Baustein-Alarm | Räume herumliegende Bausteine weg. | 120 | alle |
| books | Bücher-Rettung | Stelle die Bücher zurück ins Regal. | 90 | alle |
| clothes | Kleider-Mission | Bringe Kleidungsstücke an ihren Platz. | 120 | alle |
| plush | Kuscheltier-Einsatz | Sammle die Kuscheltiere ein. | 90 | alle |
| floor | Boden-Blitz | Räume fünf Dinge vom Boden weg. | 120 | alle |
| desk | Schreibtisch-Rettung | Räume drei Dinge vom Tisch an ihren Platz. | 90 | alle |
| shoes | Schuh-Patrouille | Stelle alle Schuhe ordentlich hin. | 90 | alle |
| toys | Spielzeug-Station | Sortiere eine Spielzeugart an ihren Platz. | 120 | alle |

Aufgaben müssen ohne Lesen durch einfache Symbole unterstützt werden; Texte in klarer Kindersprache. Keine gefährlichen Aufgaben, kein Umgang mit Reinigungschemikalien, Steckdosen, scharfen Gegenständen oder schweren Möbeln. Eltern können ungeeignete Aufgaben vor Sessionstart deaktivieren; mindestens eine muss aktiv bleiben. Wenn eine Aufgabe im Zimmer nicht passt, „Überspringen“ anbieten.

**Challenge-Schema:** `id`, `title`, `instruction`, `icon`, `durationSeconds`, `enabledByDefault`, `supportedModes`. Optional später `category`, `difficulty`, `customInstructions`.

## 6. Screen-Spezifikation

1. **Home:** Logo, Superhelden-Teddy, Slogan, CTA „Modus auswählen“, diskreter Settings-Link.
2. **ModeSelect:** 3 grosse, gut unterscheidbare Moduskarten; Unterauswahl bei Wettkampf.
3. **SessionSetup:** Namen, Bestätigungsmodus, Challenge-Anzahl, aktive Aufgaben, Start.
4. **Wheel:** animiertes Glücksrad mit mindestens 4 gut lesbaren Segmenten; bei weniger aktiven Challenges Segmente ggf. mehrfach visualisieren, Auswahl fair über eindeutige IDs; zugänglicher Alternativbutton „Zufällig auswählen“ für reduzierte Bewegung.
5. **Challenge:** Aufgabe, Icon, Timer, Pause, Weiter ohne Zeitlimit, je nach Modus 1–2 Abschlussaktionen, Überspringen.
6. **Confirmation:** expliziter Dialog bei Erwachsenenbestätigung; sonst unmittelbare Bestätigung nach „Geschafft!“.
7. **Reward:** Punktestand/Münzen/Abzeichen, positive Animation, nächste Runde.
8. **Results:** Solo-/Team-/Wettkampfergebnis, bei Wettkampf Gewinner oder Gleichstand, Neustart/Home.
9. **Settings:** Animationen reduzieren, Ton an/aus (Default aus), lokale Daten löschen mit doppelter Bestätigung.

**UI-Design:** Dunkles Marineblau als Basis; Neonblau, Pink und Gelb als Akzente; grosse gerundete Buttons; Poppins oder Quicksand (mit lokalem Fallback). Kontrast mindestens WCAG AA, sichtbarer Fokus, Touchflächen mindestens 44×44 CSS-Pixel, responsive ab 320px, kein horizontales Scrollen. Nicht allein Farbe als Statussignal nutzen. Kein überladener Bildschirm. Animationen respektieren `prefers-reduced-motion`.

## 7. Technische Architektur

**Stack (MVP-Vorgabe):** React + TypeScript + Vite; CSS Modules oder normales CSS mit Design-Tokens; Vitest + React Testing Library für Unit/Komponententests; Playwright für E2E. Keine unnötige UI-Bibliothek. PWA über `vite-plugin-pwa` oder gleichwertig, mit sauberer Offline-Strategie.

**Deployment:** Statische Hosting-Plattform, HTTPS; kein Backend, keine Nutzerkonten, keine externen Analyse- oder Werbedienste. Keine Cloud-Synchronisierung. Bilder/Fonts möglichst lokal gebündelt. Kein Mikrofon- oder Kamerazugriff im MVP.

**Zustand:** klare Trennung zwischen Domänenlogik (`gameEngine`), Challenge-Daten, Persistenz und UI. Für die Spielengine pure Funktionen und einen expliziten Session-State-Machine-Ansatz verwenden.

**Vorgeschlagene Ordnerstruktur:**
```
src/
  app/                 # Routing / App-Shell
  components/          # Button, Modal, Timer, Wheel, ScoreBoard
  screens/             # Home, ModeSelect, Setup, Wheel, Challenge, Results
  domain/              # types, gameEngine, scoring, selection, badges
  data/                # challenges.de.ts
  storage/             # versioned localStorage adapter
  styles/              # tokens, global styles
  test/                # fixtures, unit, integration
public/                # Icons, Illustrationen, PWA assets
```

## 8. Datenmodell (TypeScript-Richtlinie)

```ts
type Mode = 'solo' | 'coop' | 'competition-turn' | 'competition-simultaneous';
type ConfirmationMode = 'self' | 'adult';
type PlayerStatus = 'pending' | 'completed' | 'skipped';
type SessionPhase = 'setup' | 'wheel' | 'challenge' | 'reward' | 'results';
interface Player { id: string; name: string; points: number; coins: number; badges: string[] }
interface Challenge { id: string; title: string; instruction: string; icon: string; durationSeconds: number; enabledByDefault: boolean; supportedModes: Mode[] }
interface RoundResult { roundId: string; challengeId: string; playerResults: Record<string, { status: PlayerStatus; confirmedAt?: string; pointsAwarded: number; coinsAwarded: number }> }
interface GameSession {
  id: string; mode: Mode; confirmationMode: ConfirmationMode;
  players: Player[]; roundsPerPlayerOrTeam: 3 | 5 | 7;
  phase: SessionPhase; currentRound: number; activePlayerId?: string;
  activeChallengeId?: string; results: RoundResult[];
  recentChallengeIds: string[]; startedAt: string; updatedAt: string;
}
```

Hinweis: `currentRound` zählt im Wechselmodus pro Spielerzug intern korrekt mit; Rundenanzahl ist in diesem Modus pro Spieler. Ein `RoundResult` muss eine eindeutige `roundId` haben. Teamwertung kann als separater `teamScore` geführt werden. Erweiterungen der Datentypen sind zulässig, sofern die Spielregeln eingehalten werden.

## 9. Speicherung und Offline

- Versioniertes `localStorage`-Format, z. B. `{schemaVersion:1, settings, profiles, activeSession, completedSessions}`.
- Bei Neuladen aktive Session soweit möglich wiederherstellen; Timer anhand gespeicherter Zeitstempel oder pausiertem Restwert konsistent rekonstruieren. **MVP-Vorgabe:** bei Reload Timer pausieren und Restzeit wiederherstellen, keine verdeckte Weiterzählung.
- Fehlerhafte oder alte gespeicherte Daten defensiv behandeln; klare Möglichkeit zum Zurücksetzen.
- Aufräumdaten ausschliesslich lokal. Hinweis: Browserdaten können gelöscht werden; keine geräteübergreifende Synchronisation.
- PWA-App-Shell und benötigte Assets offline cachen; keine irreführende Offline-Zusage vor dem ersten erfolgreichen Laden.

## 10. Timer, Glücksrad und Zustandsübergänge

- Timer: `remainingMs`, `running`, `startedAt` bzw. `lastResumedAt`; Intervall dient nur zur Anzeige, Zeitberechnung basiert auf real verstrichener Zeit. Cleanup aller Intervalle.
- Glücksrad: Auswahl per `crypto.getRandomValues` oder fairer Standard-Zufallsfunktion; Auswahl erfolgt einmalig vor Animation. Keine zweite Auswahl nach Animation. Animation 2–3 Sekunden, bei reduzierter Bewegung sofortiges Ergebnis.
- Rad während Drehung deaktivieren; doppeltes Starten verhindern.
- Erlaubte Phasenübergänge: `setup -> wheel -> challenge -> reward -> wheel ... -> results`; bei Wettkampf-Simultanmodus erst weiter, wenn beide Spieler `completed` oder `skipped` sind.
- Zurücknavigation zeigt Warnung bei Sessionabbruch; Datenverlust verhindern.
- UI-Buttons dürfen nur Aktionen auslösen, die im aktuellen Zustand erlaubt sind.

## 11. Qualität, Barrierefreiheit, Datenschutz

- Gut lesbare Texte, grosse Buttons, Screenreader-Labels, Tastaturbedienbarkeit, Fokusmanagement in Dialogen.
- Keine Dark Patterns, keine künstlichen Kaufanreize, keine Bestrafung bei Misserfolg.
- Kindgerechte positive Sprache; Wettbewerbsresultate respektvoll und ohne abwertende Meldungen.
- Kein Tracking, keine externen Datenübermittlungen, keine Foto-/Kameraverarbeitung.
- Eingaben validieren und gegen Script-Injection absichern; React-Textausgabe statt `dangerouslySetInnerHTML`.
- Fehlerzustände: keine aktiven Challenges, beschädigter Spielstand, PWA-Update während Session, unterbrochene Animation, Browser-Reload, Tab-Wechsel, Touch-Doppelklick.

## 12. Tests und Akzeptanzkriterien

### Funktionale E2E-Tests
1. Home zeigt genau einen dominanten CTA; Auswahl führt zu Moduswahl.
2. Solo mit drei Challenges: Rad drehen, Aufgabe starten, pausieren, bestätigen, +10 Punkte/+1 Münze je bestätigter Aufgabe, Ergebnis nach drei.
3. Kooperation: zwei Namen, gemeinsamer Punktestand, eine Bestätigung je Challenge.
4. Wettkampf abwechselnd: 3 Challenges **je Spieler** = sechs Züge; Reihenfolge A/B/A/B/A/B; Gleichstand und Sieg korrekt.
5. Wettkampf gleichzeitig: gleiche Aufgabe für beide; unabhängige Bestätigung; kein Fortschritt, bevor beide abgeschlossen/übersprungen haben.
6. Bestätigung „Kind“ und „Erwachsene“ führen zu unterschiedlichen UI-Flows; bei Erwachsenenbestätigung keine Gutschrift vor Dialogbestätigung.
7. Wiederholtes Klicken vergibt Punkte nur einmal.
8. Münzen lassen sich sammeln; kein Shop oder Einlösen.
9. Keine Tagesziele oder Streaks.
10. Session bleibt nach Reload nutzbar; Timer pausiert mit konsistentem Restwert.
11. Aufgaben überspringen ohne Punkte; keine Endlosschleifen bei nur einer aktivierten Aufgabe.
12. Mobile Darstellung bei 320px und 390px ohne horizontales Scrollen; Tastatur- und Screenreader-Grundbedienbarkeit.
13. PWA nach erstem Laden ohne Netzwerk nutzbar.

### Unit-Tests
- `selectChallenge` fair, nur aktive/geeignete Aufgaben, Wiederholungsvermeidung.
- `awardCompletion` idempotent.
- `nextTurn` korrekte Abfolge für zwei Spieler.
- `isRoundFinished` simultaner Modus wartet auf beide.
- `computeWinner` Sieg/Gleichstand.
- `restoreSession` valide/ungültige/alte Daten.
- Timer Pause/Resume/Reload und Zeitablauf.

## 13. Implementierungsreihenfolge für KI-Coding-Tool

1. Projektstruktur, TypeScript-Typen, Design-Tokens und Challenge-Katalog anlegen.
2. Pure Game-Engine und Unit-Tests implementieren.
3. Home, Moduswahl und Setup bauen.
4. Glücksrad mit konsistenter Auswahl/Animation entwickeln.
5. Challenge-Screen, Timer, Bestätigung und Überspringen implementieren.
6. Solo und Kooperation end-to-end lauffähig machen.
7. Beide Wettkampfvarianten samt Ergebnislogik ergänzen.
8. Punkte, Münzen, Abzeichen und lokale Speicherung integrieren.
9. PWA, Accessibility, Tests und mobile Politur.
10. README mit Installation, Start, Build, Test, Architektur und bekannten Grenzen schreiben.

**Definition of Done:** `npm install`, `npm run dev`, `npm run build` und `npm test` funktionieren; E2E-Tests dokumentiert und ausführbar; keine Platzhalter-Screens, keine nur simulierte Spielmechanik; App vollständig auf Deutsch; Spielzustand konsistent; keine AR-Funktion vorgetäuscht.

## 14. Explizit ausserhalb des MVP

- Kamerascans, Computer Vision, AR-Overlays, KI-Bilderkennung.
- Multiplayer über mehrere Geräte / Online-Räume.
- Anmeldung, Server, Cloud-Datenbank, Push-Benachrichtigungen.
- Münzshop, Echtgeldkäufe, monetäre Belohnungen.
- Verpflichtende Tagesziele, Streaks, Rankings gegen fremde Kinder.
- Automatische Validierung, ob wirklich aufgeräumt wurde.

## 15. Spätere Produktphasen

**Phase 2:** optionale Wochenziele, weitere Abzeichen, eigener Aufgaben-Editor, mögliche Verwendung von Münzen (noch offen), weitere Spielinhalte.

**Phase 3 – Vision von Leonie:** aufgeräumtes Kinderzimmer als Referenz aufnehmen, später Ist-Zustand erfassen, Unterschiede erkennen und per AR visuell markieren. Zuerst Machbarkeitsstudie zu Kameraausrichtung, Licht, Datenschutz, On-Device-Bildverarbeitung und Fehlalarmen; erst danach implementieren. Niemals behaupten, eine einfache Bilddifferenz könne zuverlässig „Unordnung“ verstehen.

## 16. Arbeitsanweisung an das KI-Coding-Tool

> Du bist ein erfahrener Full-Stack-Entwickler mit Fokus auf React, TypeScript, kindgerechtes UX-Design und testbare Zustandslogik. Implementiere **AufräumHelden** anhand dieses PROJECT.md als vollständig spielbaren, mobiloptimierten Offline-first-MVP. Beginne mit einer kurzen Architekturübersicht und einer Implementierungs-Checkliste. Setze die Funktionen anschliessend in der angegebenen Reihenfolge tatsächlich um, inklusive Unit- und E2E-Tests. Vermeide unnötige Bibliotheken, Cloud-Dienste und Accounts. Respektiere alle als verbindlich markierten Produktentscheidungen. Wenn du eine technisch notwendige Entscheidung treffen musst, wähle die einfachste wartbare Variante, dokumentiere sie im README und arbeite weiter. Stelle nur Rückfragen, wenn eine Unklarheit eine verbindliche Entscheidung verletzen könnte. Führe nach der Implementierung Build und Tests aus, behebe Fehler und berichte nachvollziehbar, was funktioniert und was noch offen ist.

---

**Hinweis zur Herkunft:** Frühere Produktideen sind aus der bisherigen Gesprächszusammenfassung rekonstruiert. Die fünf Entscheidungen vom 11.10.2026 sind vom Nutzer ausdrücklich bestätigt. Detailregeln wie 10 Punkte pro Aufgabe, fünf Runden als Standard oder ein Gerät für zwei Spieler sind bewusst als neue MVP-Vorgaben festgelegt und dürfen nicht als historisch beschlossen dargestellt werden.
