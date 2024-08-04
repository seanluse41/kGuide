// src/components/dialogUtils.ts

import { Button, Dialog } from 'kintone-ui-component';
import { setupI18n } from '../../i18n';

export const showConfigDialog = async (title: string, content: string, headerText: string, icon: 'info' | 'warning' | 'success' | 'error'): Promise<boolean> => {
  const i18n = await setupI18n();

  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: i18n.t('createNewRepository'),
      type: 'submit'
    });
    const cancelButton = new Button({
      text: i18n.t('cancel'),
      type: 'normal'
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const dialog = new Dialog({
      title: title,
      content: `<div>${content}</div>`,
      footer: footerDiv,
      header: `<div>${headerText}</div>`,
      icon: icon,
      container: document.body,
      footerVisible: true
    });

    okButton.addEventListener('click', () => {
      dialog.close();
      resolve(true);
    });

    cancelButton.addEventListener('click', () => {
      dialog.close();
      resolve(false);
    });

    dialog.open();
  });
};

export const showNoGuideDialog = async (): Promise<boolean> => {
  const i18n = await setupI18n();

  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: i18n.t('createNewGuide'),
      type: 'submit'
    });
    const cancelButton = new Button({
      text: i18n.t('cancel'),
      type: 'normal'
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const noGuideDialog = new Dialog({
      title: i18n.t('noGuideTitle'),
      content: `<div>${i18n.t('noGuideContent')}</div>`,
      footer: footerDiv,
      header: `<div>${i18n.t('noGuideFound')}</div>`,
      icon: 'info',
      container: document.body,
      footerVisible: true
    });

    okButton.addEventListener('click', () => {
      noGuideDialog.close();
      resolve(true);
    });

    cancelButton.addEventListener('click', () => {
      noGuideDialog.close();
      resolve(false);
    });

    noGuideDialog.open();
  });
};

export const showCreateGuideDialog = async (): Promise<boolean> => {
  const i18n = await setupI18n();

  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: i18n.t('createNewGuide'),
      type: 'submit'
    });
    const cancelButton = new Button({
      text: i18n.t('cancel'),
      type: 'normal'
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const createGuideDialog = new Dialog({
      title: i18n.t('createNewTourTitle'),
      content: `<div>${i18n.t('createNewTourContent')}</div>`,
      footer: footerDiv,
      header: `<div>${i18n.t('createNewTourHeader')}</div>`,
      icon: 'warning',
      container: document.body,
      footerVisible: true
    });

    okButton.addEventListener('click', () => {
      createGuideDialog.close();
      resolve(true);
    });

    cancelButton.addEventListener('click', () => {
      createGuideDialog.close();
      resolve(false);
    });

    createGuideDialog.open();
  });
};