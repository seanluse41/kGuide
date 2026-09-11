<script>
  import { Notification } from 'kintone-ui-component';

  const DURATION = 2000;

  let { notice = $bindable(null) } = $props();

  $effect(() => {
    if (!notice) return;

    const instance = new Notification({
      text: notice.text,
      type: notice.type || 'danger',
      duration: DURATION,
      container: document.body,
    });
    instance.open();

    const timer = window.setTimeout(() => {
      instance.remove();
      notice = null;
    }, DURATION + 500);

    return () => {
      window.clearTimeout(timer);
      instance.remove();
    };
  });
</script>
