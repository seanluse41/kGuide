<script>
  import { Checkbox, Text } from 'kintone-ui-component';
  import { button, place } from './lib/attachments.svelte.js';
  import Dialog from './components/Dialog.svelte';
  import Notice from './components/Notice.svelte';
  import Spinner from './components/Spinner.svelte';
  import { getConfig, setConfig } from './lib/pluginConfig.js';
  import { createRepositoryApp } from './lib/repositoryApp.js';
  import { STRIPE_PORTAL_URL } from './lib/license.js';
  import { checkForUpdates, contactSupport, requestUpdate } from './lib/updates.js';
  import { t } from './lib/i18n.js';

  const config = getConfig();

  let dialog = $state(null);
  let notice = $state(null);
  let busy = $state(false);

  const appIdField = new Text({
    label: t('repositoryAppId'),
    value: config.repositoryAppId,
    className: 'kguide-config-field',
  });

  const secretKeyField = new Text({
    label: t('secretKey'),
    value: config.secretKey,
    className: 'kguide-config-field',
  });

  const nonAdminCheckbox = new Checkbox({
    items: [{ label: t('allowNonAdminGuideCreation'), value: 'enabled' }],
    value: config.nonAdminGuideCreation ? ['enabled'] : [],
    className: 'kguide-config-field',
  });

  const currentValues = () => ({
    repositoryAppId: appIdField.value,
    secretKey: secretKeyField.value,
    nonAdminGuideCreation: nonAdminCheckbox.value.includes('enabled'),
  });

  const save = async () => {
    await setConfig(currentValues());
    dialog = {
      title: t('successLabel'),
      content: t('pluginSettingsSaved'),
      icon: 'success',
      onclose: () => {
        window.location.href = `../../flow?app=${kintone.app.getId()}`;
      },
    };
  };

  const cancel = () => {
    window.location.href = `../../${kintone.app.getId()}/plugin/`;
  };

  const confirmCreateRepository = () => {
    dialog = {
      title: t('createRepositoryConfirmTitle'),
      content: t('createRepositoryConfirmContent'),
      header: t('confirmationRequired'),
      icon: 'info',
      cancel: true,
      onconfirm: createRepository,
    };
  };

  const createRepository = async () => {
    busy = true;
    try {
      const appId = await createRepositoryApp();
      await setConfig({ ...currentValues(), repositoryAppId: appId });
      dialog = {
        title: t('repositoryCreatedTitle'),
        content: t('repositoryCreatedMessage', { appId }),
        header: t('successLabel'),
        icon: 'success',
        onclose: () => location.reload(),
      };
    } catch (error) {
      console.error('Error creating repository app:', error);
      dialog = {
        title: t('errorLabel'),
        content: t('errorCreatingRepositoryMessage'),
        icon: 'error',
      };
    } finally {
      busy = false;
    }
  };

  const runUpdateCheck = async () => {
    try {
      const result = await checkForUpdates();

      if (result.current) {
        notice = { text: t('alreadyUpToDate'), type: 'success' };
        return;
      }

      dialog = {
        title: t('updateAvailableTitle'),
        content: t('updateAvailableMessage'),
        header: t('updateAvailable'),
        icon: 'info',
        cancel: true,
        onconfirm: () => requestUpdate(result.version),
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      dialog = {
        title: t('errorLabel'),
        content: t('errorCheckingForUpdates'),
        icon: 'error',
      };
    }
  };

  const runContactSupport = async () => {
    try {
      await contactSupport();
    } catch (error) {
      console.error('Error fetching plugin version:', error);
      notice = { text: t('errorFetchingPluginVersion'), type: 'danger' };
    }
  };

  const openStripePortal = () => window.open(STRIPE_PORTAL_URL, '_blank', 'noopener');

  // Every button on this screen is styled the same way.
  const configButton = (text, onClick, type = 'normal') =>
    button({ text, type, className: 'kguide-config-button', onClick });
</script>

<h2>{t('settingsForKGuide')}</h2>
<p>{t('pleaseInputAppId')}</p>
<p>{t('ifRepositoryNotExist')}</p>

<div {@attach place(appIdField)}></div>
<div {@attach place(secretKeyField)}></div>
<div {@attach place(nonAdminCheckbox)}></div>

<div class="kguide-config-actions">
  <div {@attach configButton(t('createRepositoryApp'), confirmCreateRepository)}></div>
  <div {@attach configButton(t('stripeCustomerPortal'), openStripePortal)}></div>
  <div {@attach configButton(t('checkForUpdates'), runUpdateCheck)}></div>
  <div {@attach configButton(t('contactSupport'), runContactSupport)}></div>
</div>

<div class="kguide-config-submit">
  <div {@attach configButton(t('cancel'), cancel)}></div>
  <div {@attach configButton(t('save'), save, 'submit')}></div>
</div>

<Dialog bind:dialog />
<Notice bind:notice />
<Spinner open={busy} />
