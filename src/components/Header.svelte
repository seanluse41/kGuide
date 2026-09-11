<script>
  import { button } from '../lib/attachments.svelte.js';
  import { t } from '../lib/i18n.js';

  let { onstart, oncreate, showCreate = false } = $props();
</script>

<div {@attach button({ text: t('startGuide'), type: 'submit', onClick: onstart })}></div>

{#if showCreate}
  <div
    {@attach button({
      text: t('createGuide'),
      type: 'submit',
      className: 'kguide-create-button',
      onClick: oncreate,
    })}
  ></div>
{/if}
