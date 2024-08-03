// src/components/dialogUtils.ts

import { Button, Dialog } from 'kintone-ui-component';

export const showConfigDialog = (title: string, content: string, headerText: string, icon: 'info' | 'warning' | 'success' | 'error'): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: 'Create New Repository',
      type: 'submit'
    });
    const cancelButton = new Button({
      text: 'Cancel',
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

export const showNoGuideDialog = (): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: 'Create New Guide',
      type: 'submit'
    });
    const cancelButton = new Button({
      text: 'Cancel',
      type: 'normal'
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const noGuideDialog = new Dialog({
      title: 'No Guide Exists',
      content: '<div>There is no guide created for this app yet. Would you like to create one?</div>',
      footer: footerDiv,
      header: '<div>No Guide Found</div>',
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

export const showCreateGuideDialog = (): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const okButton = new Button({
      text: 'Create New Guide',
      type: 'submit'
    });
    const cancelButton = new Button({
      text: 'Cancel',
      type: 'normal'
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const createGuideDialog = new Dialog({
      title: 'Create New Tour?',
      content: '<div>Any Existing Tours will be Overwritten.</div>',
      footer: footerDiv,
      header: '<div>Create New Tour?</div>',
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