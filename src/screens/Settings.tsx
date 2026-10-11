import { useState } from 'react';
import { Modal } from '../components/Modal';
import { useFocusOnMount } from '../app/hooks';
import { BADGES } from '../domain/badges';
import type { Profile, Settings as SettingsType } from '../storage/storage';

interface Props {
  settings: SettingsType;
  profiles: Profile[];
  onChange: (patch: Partial<SettingsType>) => void;
  onReset: () => void;
  onBack: () => void;
}

export function Settings({ settings, profiles, onChange, onReset, onBack }: Props) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
      <h1 ref={titleRef} tabIndex={-1} className="screen-title">
        Einstellungen
      </h1>
      <div className="card stack">
        <label className="switch">
          <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => onChange({ reduceMotion: e.target.checked })} />
          <span>Animationen reduzieren</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={settings.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
          <span>Ton</span>
        </label>
      </div>

      {profiles.length > 0 && (
        <section className="card stack" aria-labelledby="profiles-title">
          <h2 id="profiles-title">Gesammelt</h2>
          <ul className="profile-list">
            {profiles.map((p) => (
              <li key={p.name}>
                <span className="profile-name">{p.name}</span>
                <span>
                  <span aria-hidden="true">🪙</span> {p.coins} Münzen
                </span>
                {p.badges.length > 0 && (
                  <span className="profile-badges">
                    {p.badges.map((b) => (
                      <span key={b} title={BADGES[b].title}>
                        <span aria-hidden="true">{BADGES[b].icon}</span>
                        <span className="sr-only">{BADGES[b].title}</span>
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card stack">
        <p className="muted small">
          Alles bleibt nur auf diesem Gerät gespeichert. Wenn die Browserdaten gelöscht werden, sind auch Münzen und Abzeichen weg.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
          Lokale Daten löschen
        </button>
      </div>

      {step === 1 && (
        <Modal
          title="Daten löschen?"
          confirmLabel="Weiter"
          cancelLabel="Abbrechen"
          tone="pink"
          onCancel={() => setStep(0)}
          onConfirm={() => setStep(2)}
        >
          Alle Münzen, Abzeichen, Einstellungen und ein laufendes Spiel werden gelöscht.
        </Modal>
      )}
      {step === 2 && (
        <Modal
          title="Wirklich alles löschen?"
          confirmLabel="Ja, alles löschen"
          cancelLabel="Nein, behalten"
          tone="pink"
          onCancel={() => setStep(0)}
          onConfirm={() => {
            setStep(0);
            onReset();
          }}
        >
          Das kann nicht rückgängig gemacht werden.
        </Modal>
      )}
    </main>
  );
}
