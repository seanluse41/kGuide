<script>
  import Header from './components/Header.svelte';
  import SidePanel from './components/SidePanel.svelte';
  import Dialog from './components/Dialog.svelte';
  import Notice from './components/Notice.svelte';
  import { getGuideSteps } from './lib/repository.js';
  import { validateLicenseKey } from './lib/license.js';
  import { startTour } from './lib/tour/index.js';
  import { t } from './lib/i18n.js';

  let { config, canCreate } = $props();

  let building = $state(false);
  let dialog = $state(null);
  let notice = $state(null);
  let tour = null;

  // Both buttons are behind the subscription, so the check lives in one place.
  const licensed = async () => {
    const result = await validateLicenseKey(config.secretKey);
    if (result.valid) return true;

    dialog = { title: t('errorLabel'), content: t(result.messageKey), icon: 'error' };
    return false;
  };

  const startGuide = async () => {
    if (!(await licensed())) return;

    let steps;
    try {
      steps = await getGuideSteps(config.repositoryAppId, kintone.app.getId());
    } catch (error) {
      console.error('Error fetching guide steps:', error);
      notice = { text: t('errorFetchingGuideSteps'), type: 'danger' };
      return;
    }

    if (steps === null) {
      dialog = {
        title: t('noGuideTitle'),
        content: t('noGuideContent'),
        header: t('noGuideFound'),
        okText: t('createNewGuide'),
        cancel: true,
        onconfirm: () => (building = true),
      };
      return;
    }

    if (steps.length === 0) {
      notice = { text: t('noStepsInGuide'), type: 'danger' };
      return;
    }

    tour = await startTour(steps);
  };

  const createGuide = async () => {
    if (!(await licensed())) return;

    dialog = {
      title: t('createNewTourTitle'),
      content: t('createNewTourContent'),
      header: t('createNewTourHeader'),
      icon: 'warning',
      okText: t('createNewGuide'),
      cancel: true,
      onconfirm: () => (building = true),
    };
  };

  // A tour outlives the page it started on unless it is torn down with the app
  $effect(() => () => tour?.destroy());
</script>

<Header onstart={startGuide} oncreate={createGuide} showCreate={canCreate} />
<SidePanel bind:open={building} repositoryAppId={config.repositoryAppId} />

<Dialog bind:dialog />
<Notice bind:notice />
