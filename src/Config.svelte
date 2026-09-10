<script>
  import { Button, Checkbox, Text } from 'kintone-ui-component';
  import { getConfig, setConfig } from './lib/pluginConfig.js';
  import { createRepositoryApp } from './lib/repositoryApp.js';
  import { STRIPE_PORTAL_URL } from './lib/license.js';
  import { checkForUpdates, contactSupport } from './lib/updates.js';
  import { t } from './lib/i18n.js';
  import { alertDialog, confirmDialog, withSpinner } from './lib/ui.js';

  const config = getConfig();

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
    await alertDialog({ title: t('successLabel'), content: t('pluginSettingsSaved'), icon: 'success' });
    window.location.href = `../../flow?app=${kintone.app.getId()}`;
  };

  const cancel = () => {
    window.location.href = `../../${kintone.app.getId()}/plugin/`;
  };

  const createRepository = async () => {
    const confirmed = await confirmDialog({
      title: t('createRepositoryConfirmTitle'),
      content: t('createRepositoryConfirmContent'),
      header: t('confirmationRequired'),
      icon: 'info',
    });
    if (!confirmed) return;

    try {
      const appId = await withSpinner(() => createRepositoryApp());
      await setConfig({ ...currentValues(), repositoryAppId: appId });
      await alertDialog({
        title: t('repositoryCreatedTitle'),
        content: t('repositoryCreatedMessage', { appId }),
        header: t('successLabel'),
        icon: 'success',
      });
      location.reload();
    } catch (error) {
      console.error('Error creating repository app:', error);
      await alertDialog({
        title: t('errorLabel'),
        content: t('errorCreatingRepositoryMessage'),
        icon: 'error',
      });
    }
  };

  const field = (component) => (node) => {
    node.appendChild(component);
  };

  const action = (text, type, onClick) => (node) => {
    const button = new Button({ text, type, className: 'kguide-config-button' });
    button.addEventListener('click', onClick);
    node.appendChild(button);
  };
</script>

<h2>{t('settingsForKGuide')}</h2>
<p>{t('pleaseInputAppId')}</p>
<p>{t('ifRepositoryNotExist')}</p>

<div {@attach field(appIdField)}></div>
<div {@attach field(secretKeyField)}></div>
<div {@attach field(nonAdminCheckbox)}></div>

<div class="kguide-config-actions">
  <div {@attach action(t('createRepositoryApp'), 'normal', createRepository)}></div>
  <div
    {@attach action(t('stripeCustomerPortal'), 'normal', () =>
      window.open(STRIPE_PORTAL_URL, '_blank', 'noopener')
    )}
  ></div>
  <div {@attach action(t('checkForUpdates'), 'normal', checkForUpdates)}></div>
  <div {@attach action(t('contactSupport'), 'normal', contactSupport)}></div>
</div>

<div class="kguide-config-submit">
  <div {@attach action(t('cancel'), 'normal', cancel)}></div>
  <div {@attach action(t('save'), 'submit', save)}></div>
</div>
