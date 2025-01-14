import { expect, Locator, Page, selectors } from '@playwright/test';
import { getSession, ISessionOptions, OverrideSessionOptions, SessionData } from './plugins';
import os from 'node:os';
import { FeatureFlagsMock } from './featureFlagsMock';

const isMac = os.platform() === 'darwin';
const modifier = isMac ? 'Meta' : 'Control';

export async function initializeSession(page: Page, settings: ISessionOptions = {}) {
  selectors.setTestIdAttribute('data-test-id');
  const session = await getSession(settings);
  await page.goto('/');
  await page.evaluate((session) => {
    if (session.token) {
      localStorage.setItem('auth_token', session.token);
    } else {
      localStorage.setItem('auth_token', null);
    }
  }, session);
  await page.goto('/');
  const featureFlagsMock = new FeatureFlagsMock(page);
  return { session, featureFlagsMock };
}

export async function setPlaywrightFlag(page: Page) {
  await page.evaluate(() => {
    window['isPlaywright'] = true;
  });
}

async function handleAuthOverrideOptions(settings: OverrideSessionOptions, session: SessionData) {
  await settings.page.goto('/');
  await settings.page.evaluate((session) => {
    if (session.token) {
      localStorage.setItem('auth_token', session.token);
    } else {
      localStorage.setItem('auth_token', null);
    }
  }, session);
}

export async function fillTextInAMonacoEditor(page: Page, selector: string, textToType: string) {
  const monacoEditor = page.locator(selector).nth(0);
  await monacoEditor.click();
  await monacoEditor.press(`${modifier}+KeyX`);
  await page.keyboard.type(textToType);
}

export async function fillTextInAMonacoEditorLocator(locator: Locator, textToType: string) {
  await locator.click();
  await locator.page().keyboard.type(textToType);
}

export async function dragAndDrop(dragSelector: Locator, dropSelector: Locator) {
  await dragSelector.dragTo(dropSelector, { force: true });
}

export async function deleteIndexedDB(page: Page, dbName: string) {
  await page.goto('/');
  await page.evaluate((dbName) => {
    indexedDB.deleteDatabase(dbName);
  }, dbName);
}

export async function isDarkTheme(page: Page) {
  const backgroundColor = await page.evaluate(() => {
    const body = document.body;
    return window.getComputedStyle(body).backgroundColor;
  });
  return backgroundColor.toLowerCase() !== '#EDF0F2' && backgroundColor.toLowerCase() !== 'rgb(237, 240, 242)';
}
export function isLoginPage(page: Page) {
  expect(page.url()).toContain('/auth/login');
}

export async function getAttByTestId(page: Page, testId: string, att: string) {
  return await page.getByTestId(testId).getAttribute(att);
}
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function setBrowserDateTimeTo(page: Page, value: Date) {
  await page.addInitScript(`{
    // Extend Date constructor to default to [value]
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${value});
        } else {
          super(...args);
        }
      }
    }
    // Override Date.now() to start from [value]
    const __DateNowOffset = ${value} - Date.now();
    const __DateNow = Date.now;
    Date.now = () => __DateNow() + __DateNowOffset;
  }`);
}

export async function assertPageShowsMessage(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible();
}
