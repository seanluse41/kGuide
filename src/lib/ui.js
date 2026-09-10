import { Button, Dialog, Notification, Spinner } from 'kintone-ui-component';
import { t } from './i18n.js';

/**
 * KUC's Dialog and Notification append themselves to `document.body` on open()
 * and their close() only hides them again, so anything opened here is removed
 * explicitly once it has served its purpose. Without this, every dialog and
 * notification the plugin ever shows stays in the DOM for the life of the page.
 */

/**
 * Opens a modal and resolves with the value of whichever button was pressed.
 *
 *
 * @param {{title: string, content: string|Node, header?: string, icon?: string,
 *   buttons: Array<{text: string, type?: string, value?: unknown}>,
 *   dismissValue?: unknown}} options
 */
const openDialog = ({ title, content, header, icon = 'info', buttons, dismissValue }) =>
  new Promise((resolve) => {
    const footer = document.createElement('div');

    const dialog = new Dialog({
      title,
      content: contentElement(content),
      header: headerElement(header ?? title),
      footer,
      icon,
      container: document.body,
      footerVisible: true,
    });

    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };

    for (const { text, type = 'normal', value } of buttons) {
      const button = new Button({ text, type });
      button.addEventListener('click', () => settle(value));
      footer.appendChild(button);
    }

    dialog.addEventListener('close', () => settle(dismissValue));

    dialog.open();
  });

/** A modal with a confirm and a cancel button. Resolves true when confirmed. */
export const confirmDialog = ({ title, content, header, icon, okText }) =>
  openDialog({
    title,
    content,
    header,
    icon,
    dismissValue: false,
    buttons: [
      { text: okText || t('ok'), type: 'submit', value: true },
      { text: t('cancel'), type: 'normal', value: false },
    ],
  });

/** A modal with a single dismiss button. Resolves once dismissed. */
export const alertDialog = ({ title, content, header, icon }) =>
  openDialog({
    title,
    content,
    header,
    icon,
    buttons: [{ text: t('ok'), type: 'submit' }],
  });

export const showError = (message) => {
  const notification = new Notification({
    text: message || t('error'),
    type: 'danger',
    duration: 2000,
    container: document.body,
  });
  notification.open();
  window.setTimeout(() => notification.remove(), 2500);
};

export const showSuccess = (message) => {
  const notification = new Notification({
    text: message || t('success'),
    type: 'success',
    duration: 2000,
    container: document.body,
  });
  notification.open();
  window.setTimeout(() => notification.remove(), 2500);
};

/**
 * Runs `task` behind a spinner and always closes it, however `task` ends.
 * Spinner.close() removes itself from the DOM, so it needs no manual cleanup.
 */
export const withSpinner = async (task, text) => {
  const spinner = new Spinner({ text: text || t('loading'), container: document.body });
  spinner.open();
  try {
    return await task();
  } finally {
    spinner.close();
  }
};

// Dialog content/header accept a string or a node. Passing a text node keeps
// caller-supplied text out of innerHTML.
const contentElement = (content) => {
  if (content instanceof Node) return content;
  const div = document.createElement('div');
  div.textContent = content ?? '';
  return div;
};

const headerElement = (header) => {
  const div = document.createElement('div');
  div.textContent = header ?? '';
  return div;
};
