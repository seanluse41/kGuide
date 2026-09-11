<script>
  import { Spinner as KucSpinner } from 'kintone-ui-component';
  import { t } from '../lib/i18n.js';

  let { open = false, text } = $props();

  $effect(() => {
    if (!open) return;
    const instance = new KucSpinner({ text: text || t('loading'), container: document.body });
    instance.open();
    return () => instance.close();
  });
</script>
