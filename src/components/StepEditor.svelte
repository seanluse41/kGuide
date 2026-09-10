<script>
  import { Button, Dropdown, Text, TextArea } from 'kintone-ui-component';
  import { t } from '../lib/i18n.js';

  const TITLE_MAX_LENGTH = 25;
  const DESCRIPTION_MAX_LENGTH = 600;

  const POSITIONS = ['right', 'left', 'top', 'bottom'];

  let { step, index, onremove } = $props();

  const bindText = (component, key, maxLength) => {
    const sync = (event) => {
      const value = event.detail.value ?? '';
      if (value.length > maxLength) {
        component.value = value.slice(0, maxLength);
        component.error = t('maxLengthReached', { count: maxLength });
      } else {
        component.error = '';
      }
      step[key] = component.value;
    };
    component.addEventListener('input', sync);
    component.addEventListener('change', sync);
  };

  const title = (node) => {
    const field = new Text({
      label: t('enterTitle'),
      value: step.title,
      className: 'kguide-step-input',
    });
    bindText(field, 'title', TITLE_MAX_LENGTH);
    node.appendChild(field);
  };

  const description = (node) => {
    const field = new TextArea({
      label: t('enterDescription'),
      value: step.description,
      className: 'kguide-step-input',
    });
    bindText(field, 'description', DESCRIPTION_MAX_LENGTH);
    node.appendChild(field);
  };

  const position = (node) => {
    const dropdown = new Dropdown({
      label: t('position'),
      items: POSITIONS.map((value) => ({ label: t(value), value })),
      value: step.position,
      className: 'kguide-step-input',
    });
    dropdown.addEventListener('change', (event) => {
      step.position = event.detail.value;
    });
    node.appendChild(dropdown);
  };

  const remove = (node) => {
    const button = new Button({ text: t('remove'), type: 'alert' });
    button.addEventListener('click', () => onremove());
    node.appendChild(button);
  };
</script>

<li class="kguide-step">
  <p class="kguide-step-field">
    <span class="kguide-step-number">{index + 1}</span>
    <span class="kguide-step-label">{step.label}</span>
    <span class="kguide-step-class">{step.fieldClass}</span>
  </p>

  <div {@attach title}></div>
  <div {@attach description}></div>
  <div {@attach position}></div>
  <div class="kguide-step-remove" {@attach remove}></div>
</li>
