import { t } from './i18n.js';
import { PLUGIN_ID } from './pluginConfig.js';

const UPDATE_URL = 'https://www.seanbase.com/getKguideUpdate';
export const SUPPORT_EMAIL = 'admin@seanbase.com';

/**
 * Nothing here reports its own failures — these throw, and the config screen
 * decides what the user sees.
 */

/** The installed version of this plugin, as kintone reports it. */
export const getPluginVersion = async () => {
  const { plugins } = await kintone.api(kintone.api.url('/k/v1/plugins.json', true), 'GET', {});
  const plugin = plugins.find((entry) => entry.id === PLUGIN_ID);
  if (!plugin) {
    throw new Error('Plugin not found');
  }
  return plugin.version;
};

const mailto = (subject, body) =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** Opens a prefilled support request in the user's mail client. */
export const contactSupport = async () => {
  const version = await getPluginVersion();
  window.location.href = mailto(t('supportEmailSubject'), t('supportEmailBody', { version }));
};

/**
 * Asks the update endpoint whether the installed version is current.
 *
 * @returns {Promise<{current: true} | {current: false, version: string}>}
 */
export const checkForUpdates = async () => {
  const version = await getPluginVersion();

  const [body, status] = await kintone.plugin.app.proxy(
    PLUGIN_ID,
    `${UPDATE_URL}?version=${encodeURIComponent(version)}`,
    'GET',
    { 'Content-Type': 'application/json', Origin: window.location.origin },
    {}
  );

  if (status !== 200) {
    throw new Error(`Update request failed with status ${status}`);
  }

  return JSON.parse(body).current === true ? { current: true } : { current: false, version };
};

/** Opens a prefilled update request for the installed version. */
export const requestUpdate = (version) => {
  window.location.href = mailto(
    t('updateRequestEmailSubject'),
    t('updateRequestEmailBody', { currentVersion: version })
  );
};
