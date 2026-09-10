import { t } from './i18n.js';
import { PLUGIN_ID } from './pluginConfig.js';
import { showError } from './ui.js';

const TOKEN_KEY = `${PLUGIN_ID}_licenseToken`;
const EXPIRATION_KEY = `${PLUGIN_ID}_tokenExpiration`;
const CHECKSUM_KEY = `${PLUGIN_ID}_tokenChecksum`;

const VALIDATE_URL = 'https://www.seanbase.com/api/validateLicense';
export const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/00g9DZb7Dedw4lWaEE';

/**
 * The subscription check is off while the rest of the plugin is being tested:
 * `validateLicenseKey` returns true without contacting the licence server, so
 * both buttons work with an empty or invalid subscription key.
 *
 * Flip this back to `true` before shipping. Nothing else has to change — the
 * call sites, the cached-token handling and the config screen are all still
 * wired up, and the warning below keeps it obvious that the check is bypassed.
 */
const LICENSE_CHECK_ENABLED = false;

if (!LICENSE_CHECK_ENABLED) {
  console.warn('kGuide: licence check is DISABLED (see LICENSE_CHECK_ENABLED in src/lib/license.js)');
}

const decodeJwtPayload = (token) => {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
  return JSON.parse(json);
};

/**
 * A cheap non-cryptographic hash over the cached token. It only catches a
 * hand-edited localStorage entry; the real check is the signed token itself,
 * which the server issues and validates.
 */
const checksum = (token, expiration) => {
  const data = token + expiration;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash &= hash; // keep it a 32-bit integer
  }
  return hash.toString(16);
};

const storeToken = (token) => {
  const expiration = String(decodeJwtPayload(token).exp);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRATION_KEY, expiration);
  localStorage.setItem(CHECKSUM_KEY, checksum(token, expiration));
};

/** True while a previously issued token is cached and still in date. */
export const isTokenValid = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiration = localStorage.getItem(EXPIRATION_KEY);
  const storedChecksum = localStorage.getItem(CHECKSUM_KEY);

  if (!token || !expiration || !storedChecksum) return false;
  if (checksum(token, expiration) !== storedChecksum) return false;

  return Date.now() < parseInt(expiration, 10) * 1000;
};

/**
 * Validates the subscription key, caching the returned token so that only the
 * first use in a token's lifetime hits the network.
 */
export const validateLicenseKey = async (secretKey) => {
  if (!LICENSE_CHECK_ENABLED) {
    return true;
  }

  if (isTokenValid()) {
    return true;
  }

  try {
    const [body, status] = await kintone.plugin.app.proxy(
      PLUGIN_ID,
      `${VALIDATE_URL}?secretKey=${encodeURIComponent(secretKey)}`,
      'GET',
      { 'Content-Type': 'application/json', Origin: window.location.origin },
      {}
    );

    if (status !== 200) {
      throw new Error(`License request failed with status ${status}`);
    }

    const { status: licenseStatus, token } = JSON.parse(body);

    if (licenseStatus === 'active' && token) {
      storeToken(token);
      return true;
    }

    showError(t('invalidOrExpiredLicense'));
    return false;
  } catch (error) {
    console.error('Error validating license:', error);
    showError(t('errorValidatingLicense'));
    return false;
  }
};
