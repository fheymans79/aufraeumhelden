# AufräumHelden

**Aufräumen macht Spaß** – ein kleines Spiel, das das Aufräumen des Kinderzimmers zu kurzen Missionen macht. Das Zimmer ist das Spielfeld, die App ist der Spielleiter: Ein Glücksrad wählt die Aufgabe, ein Timer gibt einen Zeitvorschlag, nach der Bestätigung gibt es Punkte, Münzen und Abzeichen.

Die App ist eine **Progressive Web App (PWA)**: Sie läuft im Browser, lässt sich auf dem iPhone über Safari → Teilen → „Zum Home-Bildschirm“ wie eine normale App ablegen und funktioniert nach dem ersten Laden auch offline. Kein App Store, kein Konto, keine Werbung, kein Tracking.

Die vollständige Spezifikation steht in [`PROJECT.md`](PROJECT.md).

## Schnellstart

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm run build      # Typecheck + Produktions-Build nach dist/
npm run preview    # Build lokal ansehen (http://localhost:4173)
npm test           # Unit- und Komponententests (Vitest)
npm run test:e2e   # End-to-End-Tests (Playwright, baut vorher selbst)
```

Voraussetzung: Node.js 22 oder neuer.

Für die E2E-Tests braucht Playwright einen Chromium. Lokal einmalig `npx playwright install chromium`. Ist schon ein Chromium vorhanden, kann er über `PLAYWRIGHT_CHROMIUM_PATH=/pfad/zu/chrome npm run test:e2e` gesetzt werden.

## Auf das iPhone bringen

1. Repo bei [Netlify](https://app.netlify.com) verbinden („Add new site → Import an existing project“). `netlify.toml` liefert Build-Befehl und Ausgabeordner, es ist nichts weiter einzustellen.
2. Die Netlify-URL auf dem iPhone in **Safari** öffnen (nicht in Chrome – nur Safari kann PWAs installieren).
3. Teilen-Symbol → **„Zum Home-Bildschirm“**. Die App startet danach im Vollbild mit eigenem Icon.
4. Einmal online öffnen, danach geht es auch offline.

Updates: Nach einem neuen Deploy zeigt die App auf dem Startbildschirm „Eine neue Version ist da“. Während eines laufenden Spiels wird nie automatisch neu geladen.

## Spielregeln (MVP)

| Modus | Spieler | Wertung |
|---|---|---|
| Allein | 1 | 10 Punkte + 1 Münze je bestätigter Aufgabe |
| Gemeinsam | 2 | gemeinsames **Teamkonto**, eine Bestätigung je Aufgabe, kein Sieger |
| Wettkampf – abwechselnd | 2 | strikt A/B/A/B, Aufgabenzahl gilt **pro Spieler** |
| Wettkampf – gleichzeitig | 2 | gleiche Aufgabe für beide, getrennt bestätigt, weiter erst wenn beide fertig/übersprungen |

- Aufgabenzahl 3 / 5 / 7 (Standard 5).
- Bestätigung durch das Kind selbst oder durch Erwachsene (Dialog „Ist die Aufgabe erledigt?“, ohne PIN).
- Überspringen ist immer möglich und gibt 0 Punkte. Keine Minuspunkte, keine Zeitstrafen, keine Streaks, keine Tagesziele.
- Abzeichen: **Erster Einsatz** (erste bestätigte Aufgabe) und **AufräumHeld** (ganze Runde gespielt), je Profil nur einmal.
- Münzen werden nur gesammelt; einen Shop gibt es bewusst nicht.

## Architektur

```
src/
  app/          App-Shell, Zustand (useReducer), Persistenz-Hooks, PWA-Registrierung, Ton
  components/   Modal, Wheel, ScoreBoard, Teddy (SVG)
  screens/      Home, ModeSelect, SessionSetup, Game (Rad/Aufgabe/Belohnung), Results, Settings
  domain/       Typen, gameEngine (pure Funktionen), selection, timer, scoring, badges
  data/         challenges.de.ts – Aufgabenkatalog
  storage/      versionierter localStorage-Adapter
  styles/       Design-Tokens und Styles
  test/         Unit- und Komponententests
e2e/            Playwright-Tests
```

**Spiel-Engine:** `src/domain/gameEngine.ts` ist eine Zustandsmaschine aus reinen Funktionen (`spinWheel`, `revealChallenge`, `awardCompletion`, `skipChallenge`, `advance` …). Jede Funktion prüft die aktuelle Phase und gibt bei unerlaubten Aktionen den unveränderten Zustand zurück. Erlaubte Übergänge: `wheel → challenge → reward → wheel … → results`. Buchungen sind idempotent, ein Doppeltipp zählt nie doppelt.

**Glücksrad:** Die Aufgabe wird **vor** der Animation per `crypto.getRandomValues` gezogen, danach berechnet `rotationFor` die Endposition so, dass genau dieses Segment am Zeiger stehen bleibt. Keine Aufgabe wiederholt sich, bevor alle geeigneten einmal dran waren. Bei reduzierter Bewegung oder über „Zufällig auswählen“ erscheint das Ergebnis sofort.

**Timer:** rechnet mit echten Zeitstempeln (`lastResumedAt`, `remainingMs`), das Intervall dient nur der Anzeige. Läuft auch weiter, wenn das Handy gesperrt ist. Beim Speichern wird ein laufender Timer mit der aktuellen Restzeit eingefroren, deshalb ist er nach einem Reload pausiert und hat nicht verdeckt weitergezählt.

**Speicherung:** `localStorage` unter dem Schlüssel `aufraeumhelden` im Format `{ schemaVersion: 1, settings, profiles, activeSession, completedSessions }`. Kaputte oder alte Daten werden defensiv verworfen (mit Hinweis), Einstellungen bleiben wenn möglich erhalten. In den Einstellungen lassen sich alle Daten mit doppelter Bestätigung löschen.

## Entscheidungen, die die Spezifikation offen liess

- **Kein Router:** Die Navigation läuft über den App-Zustand. Die Zurück-Geste des Browsers öffnet während eines Spiels den Dialog „Spiel beenden?“.
- **Profile** werden über den Spielernamen identifiziert. Wer denselben Namen nochmals eingibt, sammelt im selben Profil weiter. Im Kooperationsmodus landen die Münzen in einem Teamprofil („Team Anna & Ben“), die Abzeichen bei beiden Kindern.
- **Abbruch:** Bricht man ein Spiel ab, bleiben die bis dahin verdienten Münzen und Abzeichen erhalten. Es wird aber nicht als abgeschlossene Runde gezählt.
- **Start vor Bestätigung:** „Geschafft“ erscheint erst, nachdem die Aufgabe gestartet wurde. Überspringen geht auch vorher.
- **Symbole:** Die Aufgaben-Icons sind System-Emojis. Das hält das Bundle klein, und auf dem iPhone sehen sie gut aus.
- **Schrift:** Quicksand (variabel) über `@fontsource-variable/quicksand`, lokal gebündelt.
- **Ton:** standardmässig aus. Eingeschaltet erklingt ein kurzer WebAudio-Dreiklang bei einer erledigten Aufgabe.
- **PWA-Updates:** `registerType: 'prompt'`. Der Hinweis erscheint nur auf dem Startbildschirm, damit ein Update nie ein laufendes Spiel unterbricht.

## Bekannte Grenzen

- Daten liegen nur im Browser des Geräts. Löscht man die Safari-Websitedaten, sind Münzen und Abzeichen weg. iOS kann Daten von Web-Apps, die lange nicht geöffnet wurden, ebenfalls entfernen.
- Die Erwachsenenbestätigung ist ein Dialog, keine Identitätsprüfung.
- Ob wirklich aufgeräumt wurde, prüft die App nicht. Das ist bewusst so (siehe Spezifikation, Abschnitt 14).
- Die E2E-Tests laufen in Chromium mit Handy-Viewport, nicht in einem echten iOS-Safari.

## Ausserhalb des MVP

Kamera, AR und Bilderkennung, Online-Multiplayer, Konten und Server, Münzshop, Streaks: siehe `PROJECT.md`, Abschnitte 14 und 15. Die Vision von Leonie (Referenzfoto des aufgeräumten Zimmers, Unordnung per AR markieren) ist Phase 3 und braucht vorher eine Machbarkeitsstudie.
