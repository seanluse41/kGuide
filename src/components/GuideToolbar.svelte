<script>
  import { Button } from 'kintone-ui-component';
  import { t } from '../lib/i18n.js';

  let { onstart, oncreate, showCreate = false } = $props();

  const startButton = (node) => {
    const button = new Button({ text: t('startGuide'), type: 'submit' });
    button.addEventListener('click', () => onstart());
    node.appendChild(button);
  };

  const createButton = (node) => {
    const button = new Button({
      text: t('createGuide'),
      type: 'submit',
      className: 'kguide-create-button',
    });
    button.addEventListener('click', () => oncreate());
    node.appendChild(button);
  };
</script>

<div {@attach startButton}></div>
{#if showCreate}
  <div {@attach createButton}></div>
{/if}
