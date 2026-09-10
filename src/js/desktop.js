import { mount, unmount } from 'svelte';
import App from '../App.svelte';
import { getConfig } from '../lib/pluginConfig.js';

let app;

kintone.events.on('app.record.create.show', () => {
  const header = kintone.app.record.getHeaderMenuSpaceElement();

  if (!header) {
    throw new Error('The header element is unavailable on this page');
  }

  if (app) {
    unmount(app);
  }

  header.classList.add('kguide-header');

  const config = getConfig();
  // getPermissions() is undocumented, so a domain where it isn't available
  // falls back to hiding the create button rather than throwing here.
  const canCreate =
    config.nonAdminGuideCreation || kintone.app.getPermissions?.()?.editApp === true;

  app = mount(App, {
    target: header,
    props: { config, canCreate },
  });
});
