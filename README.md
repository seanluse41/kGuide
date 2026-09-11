# kGuide

A kintone plugin for building and playing guided tours on a per-app basis. An
app admin picks fields on the record-create form, writes a title and a
description for each, and everyone else can replay that as a step-by-step tour.

Built on the
[Modern Modern Kintone Plugin Template](https://github.com/seanluse41/Modern-Modern-Kintone-Plugin-Template):
Vite, Svelte 5, Kintone UI Components, and i18n.

## Setup

```bash
npm i
cp .env.example .env   # fill in your base URL, username, and password
npm run build
npm run pack           # needs private.ppk in the project root
npm run upload
```

`private.ppk` is the plugin's signing key and determines its plugin ID. Keep the
existing one — running `npm run keygen` mints a *new* key, which publishes a new
plugin rather than an update to the installed one.

## How it works

### Repository app

Guides aren't stored in the plugin config; they live in records of a separate
kintone app, one record per app that has a guide. The config screen's **Create
Repository App** button builds that app with the right fields
(`src/lib/repositoryApp.js`), and one repository is normally enough for a whole
domain.

### Building a guide

**Create kGuide** opens a side panel and puts the page into picking mode.
`src/lib/elementPicker.js` captures hover and click on the record form, resolves
whatever is under the cursor to its enclosing kintone field
(`src/lib/fields.js`), and hands it to `SidePanel.svelte`, which holds the
steps as component state. Saving writes them to the repository app through
`src/lib/repository.js`.

### Playing a guide

**Start kGuide** loads that app's steps and hands them to driver.js
(`src/lib/tour/index.js`).

Kintone opens dropdowns, date pickers, lookup dialogs and rich-text menus by
appending them to the end of `document.body`, which puts them outside the
element driver.js has spotlighted — so the tour overlay covers them and they
stop being clickable. `src/lib/tour/observers.js` watches the document for those
elements and routes each one to a handler in `src/lib/tour/overlays/` that knows
how to keep it usable, and puts the DOM back when it closes. Adding support for
another kintone widget means adding one module there and listing it in
`observers.js`.

## Layout

```
src/
  js/                  entry points, one per manifest target
  App.svelte           record-create page: toolbar + builder
  Config.svelte        plugin settings screen
  Mobile.svelte        placeholder; guides are desktop-only for now
  components/          toolbar, guide builder panel, step editor
  lib/
    i18n.js            initialized on import; just `import { t }`
    pluginConfig.js    typed read/write of the flat plugin config
    fields.js          kintone field lookup and group expansion
    elementPicker.js   hover/click field picking
    repository.js      read and write guides
    repositoryApp.js   create the repository app
    license.js         subscription validation
    updates.js         version check and support mail
    ui.js              dialogs, notifications, spinner
    tour/              driver.js setup and kintone overlay handling
  locales/             en.json, ja.json
plugin/                everything that gets packed into the .zip
```

`plugin/css/driver.css` is copied out of `node_modules` by `npm run build`, so
it always matches the installed driver.js. It isn't checked in — build before
you pack.

## i18n

`src/lib/i18n.js` reads the kintone user's language and initializes
synchronously, so any module can `import { t } from './lib/i18n.js'` and call it
directly. Add keys to both `src/locales/en.json` and `src/locales/ja.json`; to
add a language, drop in another JSON file and register it in `i18n.js`.

## Kintone UI Components

KUC components are custom elements: construct one, then place it with a Svelte
[attachment](https://svelte.dev/docs/svelte/@attach).

```svelte
<script>
  import { Button } from 'kintone-ui-component';

  const kuc = (node) => {
    const button = new Button({ text: 'Click me', type: 'submit' });
    button.addEventListener('click', () => {});
    node.appendChild(button);
  };
</script>

<div {@attach kuc}></div>
```

Most components end up inside the DOM Svelte manages and are cleaned up with it.
`Dialog` and `Notification` are the exception — `open()` appends them to
`document.body` and `close()` only hides them — so each is wrapped in a Svelte
component (`src/components/Dialog.svelte`, `Notice.svelte`, `Spinner.svelte`)
that builds the instance in an `$effect` and removes it on teardown.

Those three are driven by state rather than called as functions. A screen keeps
a `dialog` or `notice` variable and assigns to it:

```js
notice = { text: t('failedToCreateGuide'), type: 'danger' };

dialog = {
  title: t('createNewTourTitle'),
  content: t('createNewTourContent'),
  cancel: true,
  onconfirm: () => (building = true),
};
```

The component clears the variable once the user is done with it, so
`<Dialog bind:dialog />` is the whole wiring. Modules under `src/lib/` never
show UI themselves — they return a verdict or throw, and the screen decides what
the user sees.
