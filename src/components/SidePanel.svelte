<script>
  import Step from './Step.svelte';
  import { button } from '../lib/attachments.svelte.js';
  import { ElementPicker } from '../lib/elementPicker.js';
  import { getFieldClass, getFieldLabel, openAllFieldGroups } from '../lib/fields.js';
  import { saveGuideSteps } from '../lib/repository.js';
  import { t } from '../lib/i18n.js';
  import Notice from './Notice.svelte';
  import Spinner from './Spinner.svelte';

  let { open = $bindable(false), repositoryAppId } = $props();

  let steps = $state([]);
  let notice = $state(null);
  let busy = $state(false);
  let nextId = 0;

  const picker = new ElementPicker({ ignoreSelector: '#kguide-builder' });

  const addStep = (element) => {
    const fieldClass = getFieldClass(element);
    if (!fieldClass) {
      notice = { text: t('couldNotIdentifyField'), type: 'danger' };
      return;
    }

    steps.push({
      id: nextId++,
      fieldClass,
      label: getFieldLabel(element) || t('noLabel'),
      title: '',
      description: '',
      position: 'right',
    });
  };

  $effect(() => {
    if (!open) return;
    openAllFieldGroups();
    picker.start(addStep);
    return () => picker.stop();
  });

  const close = () => {
    steps = [];
    open = false;
  };

  const save = async () => {
    busy = true;
    try {
      await saveGuideSteps(
        repositoryAppId,
        kintone.app.getId(),
        steps.map(({ fieldClass, title, description, position }) => ({
          element: `.${fieldClass}`,
          popover: { title, description, side: position, align: 'end' },
        }))
      );
      notice = { text: t('guideCreatedSuccessfully'), type: 'success' };
      close();
    } catch (error) {
      console.error('Error saving guide:', error);
      notice = { text: t('failedToCreateGuide'), type: 'danger' };
    } finally {
      busy = false;
    }
  };

  const portal = (node) => {
    document.body.appendChild(node);
    return () => node.remove();
  };

</script>

<aside id="kguide-builder" class:open {@attach portal}>
  <h2 class="kguide-builder-heading">{t('createGuide')}</h2>

  {#if steps.length === 0}
    <p class="kguide-builder-hint">{t('pickFieldsHint')}</p>
  {/if}

  <ol class="kguide-step-list">
    {#each steps as step, index (step.id)}
      <Step
        {step}
        {index}
        onremove={() => {
          steps = steps.filter((candidate) => candidate.id !== step.id);
        }}
      />
    {/each}
  </ol>

  <div class="kguide-builder-actions">
    <div
      {@attach button({ text: t('close'), className: 'kguide-panel-button', onClick: close })}
    ></div>
    <div
      {@attach button({
        text: t('finishGuideCreation'),
        type: 'submit',
        className: 'kguide-panel-button',
        onClick: save,
        disabled: () => steps.length === 0,
      })}
    ></div>
  </div>
</aside>

<Notice bind:notice />
<Spinner open={busy} />
