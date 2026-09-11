<script>
  import { Dialog as KucDialog, Button } from 'kintone-ui-component';
  import { t } from '../lib/i18n.js';

  let { dialog = $bindable(null) } = $props();

  const textNode = (text) => {
    const node = document.createElement('div');
    node.textContent = text ?? '';
    return node;
  };

  $effect(() => {
    if (!dialog) return;

    const { title = '', content = '', header, icon = 'info', okText, cancel, onconfirm, onclose } =
      dialog;

    const footer = document.createElement('div');
    const instance = new KucDialog({
      title,
      content: textNode(content),
      header: textNode(header ?? title),
      footer,
      icon,
      container: document.body,
      footerVisible: true,
    });

    let settled = false;
    const settle = (confirmed) => {
      if (settled) return;
      settled = true;
      instance.close();
      instance.remove();
      dialog = null;
      if (confirmed) onconfirm?.();
      onclose?.();
    };

    const ok = new Button({ text: okText || t('ok'), type: 'submit' });
    ok.addEventListener('click', () => settle(true));
    footer.appendChild(ok);

    if (cancel) {
      const dismiss = new Button({ text: t('cancel'), type: 'normal' });
      dismiss.addEventListener('click', () => settle(false));
      footer.appendChild(dismiss);
    }

    instance.addEventListener('close', () => settle(false));
    instance.open();

    return () => {
      settled = true;
      instance.close();
      instance.remove();
    };
  });
</script>
