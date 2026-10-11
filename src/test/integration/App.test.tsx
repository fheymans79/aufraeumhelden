import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../app/App';
import { STORAGE_KEY } from '../../storage/storage';

async function startGame(user: ReturnType<typeof userEvent.setup>, opts: { mode?: RegExp; sub?: RegExp; adult?: boolean; rounds?: string } = {}) {
  await user.click(screen.getByRole('button', { name: 'Modus auswählen' }));
  await user.click(screen.getByRole('button', { name: opts.mode ?? /Allein/ }));
  if (opts.sub) await user.click(screen.getByRole('button', { name: opts.sub }));
  if (opts.adult) await user.click(screen.getByLabelText(/Erwachsene bestätigen/));
  await user.click(screen.getByLabelText(opts.rounds ?? '3'));
  await user.click(screen.getByRole('button', { name: /Los geht/ }));
}

async function toChallenge(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Zufällig auswählen/ }));
  await user.click(await screen.findByRole('button', { name: /Start/ }));
}

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('Home zeigt genau einen dominanten CTA', () => {
    render(<App />);
    const big = document.querySelectorAll('.btn-xl');
    expect(big).toHaveLength(1);
    expect(big[0]).toHaveTextContent('Modus auswählen');
    expect(screen.getByText('Aufräumen macht Spaß')).toBeInTheDocument();
  });

  it('Selbstbestätigung: Geschafft gibt sofort 10 Punkte und 1 Münze – nur einmal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startGame(user);
    await toChallenge(user);
    const done = screen.getByRole('button', { name: /Geschafft/ });
    await user.dblClick(done);
    expect(await screen.findByText('Super gemacht!')).toBeInTheDocument();
    expect(screen.getByTestId('points-p1')).toHaveTextContent('10');
    expect(screen.getByTestId('coins-p1')).toHaveTextContent('1');
  });

  it('Erwachsenenbestätigung: keine Gutschrift vor Dialogbestätigung', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startGame(user, { adult: true });
    await toChallenge(user);
    await user.click(screen.getByRole('button', { name: /Erwachsene bestätigen/ }));
    const dialog = screen.getByRole('dialog', { name: 'Ist die Aufgabe erledigt?' });
    expect(screen.getByTestId('points-p1')).toHaveTextContent('0');
    await user.click(within(dialog).getByRole('button', { name: 'Noch nicht' }));
    expect(screen.getByTestId('points-p1')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: /Erwachsene bestätigen/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ja, erledigt' }));
    expect(screen.getByTestId('points-p1')).toHaveTextContent('10');
  });

  it('Kooperation: gemeinsames Teamkonto', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startGame(user, { mode: /Gemeinsam/ });
    expect(screen.getByRole('list', { name: 'Teamkonto' })).toHaveTextContent('Held 1 & Held 2');
    await toChallenge(user);
    expect(screen.getAllByRole('button', { name: /Geschafft/ })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Geschafft/ }));
    expect(screen.getByTestId('points-team')).toHaveTextContent('10');
  });

  it('Gleichzeitig: kein Fortschritt, bevor beide abgeschlossen haben', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startGame(user, { mode: /Wettkampf/, sub: /Gleichzeitig/ });
    await toChallenge(user);
    await user.click(screen.getByRole('button', { name: 'Geschafft für Held 1' }));
    expect(screen.queryByText('Super gemacht!')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Überspringen für Held 2' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Überspringen' }));
    expect(await screen.findByText('Super gemacht!')).toBeInTheDocument();
    expect(screen.getByTestId('points-p1')).toHaveTextContent('10');
    expect(screen.getByTestId('points-p2')).toHaveTextContent('0');
  });

  it('Reload stellt die Session mit pausiertem Timer wieder her', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await startGame(user);
    await toChallenge(user);
    expect(screen.getByRole('button', { name: /Pause/ })).toBeInTheDocument();
    unmount();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.activeSession.timer.running).toBe(false);
    render(<App />);
    expect(screen.getByRole('button', { name: /Fortsetzen/ })).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('Name wird als Text ausgegeben, nicht als HTML', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Modus auswählen' }));
    await user.click(screen.getByRole('button', { name: /Allein/ }));
    await user.type(screen.getByLabelText('Name Held 1'), '<img src=x>');
    await user.click(screen.getByRole('button', { name: /Los geht/ }));
    expect(screen.getByText('<img src=x>')).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('beschädigter Spielstand wird gemeldet und zurückgesetzt', () => {
    localStorage.setItem(STORAGE_KEY, '{kaputt');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent(/beschädigt/);
    expect(screen.getByRole('button', { name: 'Modus auswählen' })).toBeInTheDocument();
  });
});
