import { mount, unmount } from 'svelte';
import Mobile from '../Mobile.svelte';
import { getConfig } from '../lib/pluginConfig.js';

let app;

kintone.events.on('mobile.app.record.create.show', () => {
  const header = kintone.mobile.app.getHeaderSpaceElement();

  if (!header) {
    throw new Error('The header element is unavailable on this page');
  }

  if (app) {
    unmount(app);
  }

  app = mount(Mobile, {
    target: header,
    props: { config: getConfig() },
  });
});
