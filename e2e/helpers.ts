import { expect, type Page } from '@playwright/test';

export async function setup(
  page: Page,
  opts: { mode: 'Allein' | 'Gemeinsam' | 'Abwechselnd' | 'Gleichzeitig'; rounds?: 3 | 5 | 7; adult?: boolean; names?: string[] },
) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Modus auswählen' }).click();
  if (opts.mode === 'Abwechselnd' || opts.mode === 'Gleichzeitig') {
    await page.getByRole('button', { name: /Wettkampf/ }).click();
    await page.getByRole('button', { name: opts.mode }).click();
  } else {
    await page.getByRole('button', { name: new RegExp(opts.mode) }).click();
  }
  for (const [i, n] of (opts.names ?? []).entries()) await page.getByLabel(`Name Held ${i + 1}`).fill(n);
  if (opts.adult) await page.getByText('Erwachsene bestätigen').click();
  await page.locator('label.choice-num', { hasText: String(opts.rounds ?? 3) }).click();
  await page.getByRole('button', { name: /Los geht/ }).click();
}

export async function pickAndStart(page: Page) {
  await page.getByRole('button', { name: /Zufällig auswählen/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('timer')).toBeVisible();
}

export async function confirmSelf(page: Page, who?: string) {
  await page.getByRole('button', { name: who ? `Geschafft für ${who}` : /Geschafft/ }).click();
}

export async function next(page: Page) {
  await page.getByRole('button', { name: /Nächste Aufgabe|Zum Ergebnis/ }).click();
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
