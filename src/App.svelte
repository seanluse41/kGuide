<script>
  import GuideToolbar from './components/GuideToolbar.svelte';
  import GuideBuilder from './components/GuideBuilder.svelte';
  import { getGuideSteps } from './lib/repository.js';
  import { validateLicenseKey } from './lib/license.js';
  import { startTour } from './lib/tour/index.js';
  import { t } from './lib/i18n.js';
  import { alertDialog, confirmDialog, showError } from './lib/ui.js';

  let { config, canCreate } = $props();

  let building = $state(false);
  let tour = null;

  // Both buttons are behind the subscription, so the check lives in one place.
  const withLicense = async (action) => {
    if (await validateLicenseKey(config.secretKey)) {
      await action();
      return;
    }
    await alertDialog({
      title: t('errorLabel'),
      content: t('invalidOrExpiredLicense'),
      icon: 'error',
    });
  };

  const startGuide = () =>
    withLicense(async () => {
      let steps;
      try {
        steps = await getGuideSteps(config.repositoryAppId, kintone.app.getId());
      } catch (error) {
        console.error('Error fetching guide steps:', error);
        showError(t('errorFetchingGuideSteps'));
        return;
      }

      if (steps === null) {
        building = await confirmDialog({
          title: t('noGuideTitle'),
          content: t('noGuideContent'),
          header: t('noGuideFound'),
          okText: t('createNewGuide'),
        });
        return;
      }

      if (steps.length === 0) {
        showError(t('noStepsInGuide'));
        return;
      }

      tour = await startTour(steps);
    });

  const createGuide = () =>
    withLicense(async () => {
      building = await confirmDialog({
        title: t('createNewTourTitle'),
        content: t('createNewTourContent'),
        header: t('createNewTourHeader'),
        icon: 'warning',
        okText: t('createNewGuide'),
      });
    });

  // A tour outlives the page it started on unless it is torn down with the app
  $effect(() => () => tour?.destroy());
</script>

<GuideToolbar onstart={startGuide} oncreate={createGuide} showCreate={canCreate} />
<GuideBuilder bind:open={building} repositoryAppId={config.repositoryAppId} />
