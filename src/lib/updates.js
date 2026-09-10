import { t } from './i18n.js';
import { PLUGIN_ID } from './pluginConfig.js';
import { alertDialog, confirmDialog, showError, showSuccess } from './ui.js';

const UPDATE_URL = 'https://www.seanbase.com/getKguideUpdate';
export const SUPPORT_EMAIL = 'admin@seanbase.com';

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
  try {
    const version = await getPluginVersion();
    window.location.href = mailto(t('supportEmailSubject'), t('supportEmailBody', { version }));
  } catch (error) {
    console.error('Error fetching plugin version:', error);
    showError(t('errorFetchingPluginVersion'));
  }
};

/**
 * Asks the update endpoint whether the installed version is current, and offers
 * to mail an update request when it isn't.
 */
export const checkForUpdates = async () => {
  try {
    const currentVersion = await getPluginVersion();

    const [body, status] = await kintone.plugin.app.proxy(
      PLUGIN_ID,
      `${UPDATE_URL}?version=${encodeURIComponent(currentVersion)}`,
      'GET',
      { 'Content-Type': 'application/json', Origin: window.location.origin },
      {}
    );

    if (status !== 200) {
      throw new Error(`Update request failed with status ${status}`);
    }

    if (JSON.parse(body).current === true) {
      showSuccess(t('alreadyUpToDate'));
      return;
    }

    const shouldUpdate = await confirmDialog({
      title: t('updateAvailableTitle'),
      content: t('updateAvailableMessage'),
      header: t('updateAvailable'),
      icon: 'info',
    });

    if (shouldUpdate) {
      window.location.href = mailto(
        t('updateRequestEmailSubject'),
        t('updateRequestEmailBody', { currentVersion })
      );
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    await alertDialog({
      title: t('errorLabel'),
      content: t('errorCheckingForUpdates'),
      icon: 'error',
    });
  }
};
