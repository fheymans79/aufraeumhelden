import { Teddy } from '../components/Teddy';
import { useFocusOnMount } from '../app/hooks';

interface HomeProps {
  onStart: () => void;
  onSettings: () => void;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export function Home({ onStart, onSettings, updateAvailable, onUpdate }: HomeProps) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  return (
    <main className="screen home">
      {updateAvailable && (
        <div className="banner" role="status">
          <span>Eine neue Version ist da.</span>
          <button type="button" className="btn btn-secondary" onClick={onUpdate}>
            Aktualisieren
          </button>
        </div>
      )}
      <div className="home-hero">
        <Teddy className="home-teddy" size={200} />
        <h1 ref={titleRef} tabIndex={-1} className="home-title">
          <span className="t-blue">Aufräum</span>
          <span className="t-pink">Helden</span>
        </h1>
        <p className="home-slogan">Aufräumen macht Spaß</p>
      </div>
      <div className="home-actions">
        <button type="button" className="btn btn-primary btn-xl btn-block" onClick={onStart}>
          Modus auswählen
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSettings}>
          Einstellungen
        </button>
      </div>
    </main>
  );
}
