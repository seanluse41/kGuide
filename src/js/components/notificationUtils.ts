// src/components/notificationUtils.ts

import { Notification } from 'kintone-ui-component';

export const showErrorNotification = (message: string = 'Error!') => {
  const errorNotification = new Notification({
    text: message,
    type: 'danger',
    className: 'options-class',
    duration: 2000,
    container: document.body
  });
  errorNotification.open();
};

export const showSuccessNotification = (message: string = 'Success!') => {
  const successNotification = new Notification({
    text: message,
    type: 'success',
    className: 'options-class',
    duration: 2000,
    container: document.body
  });
  successNotification.open();
};

export const showSpinner = (text: string = 'Loading...') => {
  const spinner = new Notification({
    text: text,
    type: 'info',
    className: 'options-class',
    duration: 0,  // 0 means it won't auto-close
    container: document.body
  });
  spinner.open();
  return spinner;
};