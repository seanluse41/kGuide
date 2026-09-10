<script>
  import { Button } from 'kintone-ui-component';
  import StepEditor from './StepEditor.svelte';
  import { ElementPicker } from '../lib/elementPicker.js';
  import { getFieldClass, getFieldLabel, openAllFieldGroups } from '../lib/fields.js';
  import { saveGuideSteps } from '../lib/repository.js';
  import { t } from '../lib/i18n.js';
  import { showError, showSuccess, withSpinner } from '../lib/ui.js';

  let { open = $bindable(false), repositoryAppId } = $props();

  let steps = $state([]);
  let nextId = 0;

  // Clicks inside the panel itself must not be read as field picks
  const picker = new ElementPicker({ ignoreSelector: '#kguide-builder' });

  const addStep = (element) => {
    const fieldClass = getFieldClass(element);
    if (!fieldClass) {
      showError(t('couldNotIdentifyField'));
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

  // The picker runs for exactly as long as the panel is open, and stops when
  // this component is torn down.
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
    try {
      await withSpinner(() =>
        saveGuideSteps(
          repositoryAppId,
          kintone.app.getId(),
          steps.map(({ fieldClass, title, description, position }) => ({
            element: `.${fieldClass}`,
            popover: { title, description, side: position, align: 'end' },
          }))
        )
      );
      showSuccess(t('guideCreatedSuccessfully'));
      close();
    } catch (error) {
      console.error('Error saving guide:', error);
      showError(t('failedToCreateGuide'));
    }
  };

  // The panel is fixed to the edge of the viewport, so it is moved out to the
  // body rather than left inside the app's header, where an ancestor's
  // overflow or transform could clip it.
  const portal = (node) => {
    document.body.appendChild(node);
    return () => node.remove();
  };

  const closeButton = (node) => {
    const button = new Button({
      text: t('close'),
      type: 'normal',
      className: 'kguide-panel-button',
    });
    button.addEventListener('click', close);
    node.appendChild(button);
  };

  const saveButton = (node) => {
    const button = new Button({
      text: t('finishGuideCreation'),
      type: 'submit',
      className: 'kguide-panel-button',
    });
    button.addEventListener('click', save);
    node.appendChild(button);
    // KUC reads `disabled` as a property, so it is kept in sync here rather
    // than through an attribute on the markup.
    $effect(() => {
      button.disabled = steps.length === 0;
    });
  };
</script>

<aside id="kguide-builder" class:open {@attach portal}>
  <h2 class="kguide-builder-heading">{t('createGuide')}</h2>

  {#if steps.length === 0}
    <p class="kguide-builder-hint">{t('pickFieldsHint')}</p>
  {/if}

  <ol class="kguide-step-list">
    {#each steps as step, index (step.id)}
      <StepEditor
        {step}
        {index}
        onremove={() => {
          steps = steps.filter((candidate) => candidate.id !== step.id);
        }}
      />
    {/each}
  </ol>

  <div class="kguide-builder-actions">
    <div {@attach closeButton}></div>
    <div {@attach saveButton}></div>
  </div>
</aside>
