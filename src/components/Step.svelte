<script>
  import { Dropdown, Text, TextArea } from 'kintone-ui-component';
  import { button } from '../lib/attachments.svelte.js';
  import { t } from '../lib/i18n.js';

  const TITLE_MAX_LENGTH = 25;
  const DESCRIPTION_MAX_LENGTH = 600;

  const POSITIONS = ['right', 'left', 'top', 'bottom'];

  let { step, index, onremove } = $props();

  /**
   * Nothing outside the child effect may read `step`.
   *
   * An attachment runs again whenever state read inside it changes, and these
   * widgets write the user's edits back to `step` — so reading it while
   * building one would add a second widget on every keystroke. Reading it in a
   * child effect instead means only the value is kept in step, which is what
   * should happen.
   */
  const textField = (Field, label, key, maxLength) => (node) => {
    const field = new Field({ label, className: 'kguide-step-input' });

    const onEdit = (event) => {
      const value = event.detail.value ?? '';
      if (value.length > maxLength) {
        field.value = value.slice(0, maxLength);
        field.error = t('maxLengthReached', { count: maxLength });
      } else {
        field.error = '';
      }
      step[key] = field.value;
    };

    field.addEventListener('input', onEdit);
    field.addEventListener('change', onEdit);
    node.appendChild(field);

    // Writing only on a real difference keeps what the user is typing from
    // being put back underneath the cursor.
    $effect(() => {
      if (field.value !== step[key]) {
        field.value = step[key];
      }
    });

    return () => field.remove();
  };

  const positionField = (node) => {
    const dropdown = new Dropdown({
      label: t('position'),
      items: POSITIONS.map((value) => ({ label: t(value), value })),
      className: 'kguide-step-input',
    });

    dropdown.addEventListener('change', (event) => {
      step.position = event.detail.value;
    });
    node.appendChild(dropdown);

    $effect(() => {
      if (dropdown.value !== step.position) {
        dropdown.value = step.position;
      }
    });

    return () => dropdown.remove();
  };
</script>

<li class="kguide-step">
  <p class="kguide-step-field">
    <span class="kguide-step-number">{index + 1}</span>
    <span class="kguide-step-label">{step.label}</span>
    <span class="kguide-step-class">{step.fieldClass}</span>
  </p>

  <div {@attach textField(Text, t('enterTitle'), 'title', TITLE_MAX_LENGTH)}></div>
  <div {@attach textField(TextArea, t('enterDescription'), 'description', DESCRIPTION_MAX_LENGTH)}></div>
  <div {@attach positionField}></div>
  <div class="kguide-step-remove" {@attach button({ text: t('remove'), type: 'alert', onClick: onremove })}></div>
</li>
