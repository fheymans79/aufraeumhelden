import { expect, test } from '@playwright/test';
import { confirmSelf, expectNoHorizontalScroll, next, pickAndStart, setup } from './helpers';

test('1 · Home zeigt genau einen dominanten CTA und führt zur Moduswahl', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.btn-xl')).toHaveCount(1);
  await expect(page.getByText('Aufräumen macht Spaß')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.getByRole('button', { name: 'Modus auswählen' }).click();
  await expect(page.getByRole('heading', { name: 'Wie wollt ihr spielen?' })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('2 · Solo mit drei Challenges inkl. Glücksrad-Animation und Pause', async ({ page }) => {
  await setup(page, { mode: 'Allein', names: ['Leonie'] });
  // Erste Runde über das animierte Rad
  await page.getByRole('button', { name: /Rad drehen/ }).click();
  await expect(page.getByText('Das Rad dreht sich …')).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click({ timeout: 6000 });
  await page.getByRole('button', { name: /Pause/ }).click();
  const paused = await page.getByTestId('timer').textContent();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('timer')).toHaveText(paused!);
  await page.getByRole('button', { name: /Fortsetzen/ }).click();
  await confirmSelf(page);
  await expect(page.getByTestId('points-p1')).toContainText('10');
  await next(page);
  for (let i = 0; i < 2; i++) {
    await pickAndStart(page);
    await confirmSelf(page);
    await next(page);
  }
  await expect(page.getByTestId('results-title')).toHaveText('Super gemacht, Leonie!');
  await expect(page.getByTestId('points-p1')).toContainText('30');
  await expect(page.getByTestId('coins-p1')).toContainText('3');
  await expect(page.getByText('Erster Einsatz')).toBeVisible();
  await expect(page.getByText('AufräumHeld', { exact: true })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('3 · Kooperation: zwei Namen, Teamkonto, eine Bestätigung je Challenge', async ({ page }) => {
  await setup(page, { mode: 'Gemeinsam', names: ['Leonie', 'Mia'] });
  await expect(page.getByRole('list', { name: 'Teamkonto' })).toContainText('Leonie & Mia');
  for (let i = 0; i < 3; i++) {
    await pickAndStart(page);
    await expect(page.getByRole('button', { name: /Geschafft/ })).toHaveCount(1);
    await confirmSelf(page);
    await next(page);
  }
  await expect(page.getByTestId('results-title')).toHaveText('Ihr seid ein tolles Team!');
  await expect(page.getByTestId('points-team')).toContainText('30');
});

test('4 · Wettkampf abwechselnd: sechs Züge A/B/A/B/A/B, Sieg', async ({ page }) => {
  await setup(page, { mode: 'Abwechselnd', names: ['Anna', 'Ben'] });
  const order: string[] = [];
  for (let i = 0; i < 6; i++) {
    await expect(page.getByTestId('round-label')).toHaveText(`Zug ${i + 1} von 6`);
    const heading = await page.getByRole('heading', { level: 1 }).textContent();
    order.push(heading!.replace(' ist dran!', ''));
    await pickAndStart(page);
    if (order[i] === 'Ben' && i === 5) {
      await page.getByRole('button', { name: 'Überspringen' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Überspringen' }).click();
    } else {
      await confirmSelf(page);
    }
    await next(page);
  }
  expect(order).toEqual(['Anna', 'Ben', 'Anna', 'Ben', 'Anna', 'Ben']);
  await expect(page.getByTestId('results-title')).toHaveText('Anna gewinnt diese Runde!');
});

test('4b · Wettkampf abwechselnd: Gleichstand', async ({ page }) => {
  await setup(page, { mode: 'Abwechselnd' });
  for (let i = 0; i < 6; i++) {
    await pickAndStart(page);
    await confirmSelf(page);
    await next(page);
  }
  await expect(page.getByTestId('results-title')).toHaveText('Unentschieden – ihr seid beide Helden!');
});

test('5 · Wettkampf gleichzeitig: gleiche Aufgabe, unabhängige Bestätigung', async ({ page }) => {
  await setup(page, { mode: 'Gleichzeitig', names: ['Anna', 'Ben'] });
  await pickAndStart(page);
  await expect(page.getByText('Beide Helden machen dieselbe Aufgabe.')).toBeVisible();
  await confirmSelf(page, 'Anna');
  await expect(page.getByRole('button', { name: /Nächste Aufgabe/ })).toHaveCount(0);
  await confirmSelf(page, 'Ben');
  await expect(page.getByTestId('points-p1')).toContainText('10');
  await expect(page.getByTestId('points-p2')).toContainText('10');
  await next(page);
  await expect(page.getByTestId('round-label')).toHaveText('Aufgabe 2 von 3');
});

test('6 · Erwachsenenbestätigung: Dialog vor Gutschrift', async ({ page }) => {
  await setup(page, { mode: 'Allein', adult: true });
  await pickAndStart(page);
  await page.getByRole('button', { name: /Erwachsene bestätigen/ }).click();
  await expect(page.getByRole('dialog', { name: 'Ist die Aufgabe erledigt?' })).toBeVisible();
  await expect(page.getByTestId('points-p1')).toContainText('0');
  await page.getByRole('button', { name: 'Ja, erledigt' }).click();
  await expect(page.getByTestId('points-p1')).toContainText('10');
});

test('7 · Mehrfaches Tippen vergibt Punkte nur einmal', async ({ page }) => {
  await setup(page, { mode: 'Allein' });
  await pickAndStart(page);
  await page.getByRole('button', { name: /Geschafft/ }).dblclick();
  await expect(page.getByTestId('points-p1')).toContainText('10');
  await expect(page.getByTestId('coins-p1')).toContainText('1');
});

test('8/9 · Münzen sammeln sich ohne Shop, keine Streaks oder Tagesziele', async ({ page }) => {
  await setup(page, { mode: 'Allein', names: ['Leonie'] });
  for (let i = 0; i < 3; i++) {
    await pickAndStart(page);
    await confirmSelf(page);
    await next(page);
  }
  await page.getByRole('button', { name: 'Noch eine Runde' }).click();
  for (let i = 0; i < 3; i++) {
    await pickAndStart(page);
    await confirmSelf(page);
    await next(page);
  }
  await expect(page.getByTestId('total-coins-Leonie')).toHaveText('6');
  const body = (await page.locator('body').textContent())!.toLowerCase();
  for (const word of ['shop', 'einlösen', 'kaufen', 'streak', 'tagesziel', 'serie']) expect(body).not.toContain(word);
});

test('10 · Session übersteht Reload, Timer pausiert mit Restzeit', async ({ page }) => {
  await setup(page, { mode: 'Allein' });
  await pickAndStart(page);
  await page.waitForTimeout(2200);
  await page.reload();
  await expect(page.getByRole('button', { name: /Fortsetzen/ })).toBeVisible();
  const t1 = await page.getByTestId('timer').textContent();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('timer')).toHaveText(t1!);
  await page.getByRole('button', { name: /Fortsetzen/ }).click();
  await confirmSelf(page);
  await expect(page.getByTestId('points-p1')).toContainText('10');
});

test('11 · Überspringen ohne Punkte; nur eine aktive Aufgabe ohne Endlosschleife', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Modus auswählen' }).click();
  await page.getByRole('button', { name: /Allein/ }).click();
  await page.getByText('Aufgaben auswählen (für Erwachsene)').click();
  const boxes = page.locator('.task-list input[type=checkbox]');
  const n = await boxes.count();
  for (let i = 1; i < n; i++) await boxes.nth(i).uncheck();
  await expect(boxes.nth(0)).toBeDisabled();
  await page.locator('label.choice-num', { hasText: '3' }).click();
  await page.getByRole('button', { name: /Los geht/ }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /Zufällig auswählen/ }).click();
    await expect(page.getByRole('heading', { name: 'Baustein-Alarm' })).toBeVisible();
    await page.getByRole('button', { name: /überspringen/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Überspringen' }).click();
    await expect(page.getByTestId('points-p1')).toContainText('0');
    await next(page);
  }
  await expect(page.getByTestId('results-title')).toBeVisible();
});

test('12 · Tastaturbedienung und Dialog-Fokus', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Modus auswählen' })).toBeFocused();
  await page.keyboard.press('Enter');
  // Fokus liegt auf der Überschrift; nächster Tab-Stopp ist die erste Moduskarte.
  await expect(page.getByRole('heading', { name: 'Wie wollt ihr spielen?' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Allein/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /Los geht/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Spiel beenden' }).click();
  const dialog = page.getByRole('dialog', { name: 'Spiel beenden?' });
  await expect(dialog.getByRole('button', { name: 'Weiterspielen' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test('Zurück-Navigation warnt vor Spielabbruch', async ({ page }) => {
  await setup(page, { mode: 'Allein' });
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Spiel beenden?' })).toBeVisible();
  await page.getByRole('button', { name: 'Weiterspielen' }).click();
  await expect(page.getByRole('button', { name: /Rad drehen/ })).toBeVisible();
});

test('13 · PWA nach erstem Laden offline nutzbar', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Modus auswählen' })).toBeVisible();
  await page.getByRole('button', { name: 'Modus auswählen' }).click();
  await page.getByRole('button', { name: /Allein/ }).click();
  await page.getByRole('button', { name: /Los geht/ }).click();
  await expect(page.getByRole('button', { name: /Rad drehen/ })).toBeVisible();
  await context.setOffline(false);
});
