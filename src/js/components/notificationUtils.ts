// src/components/notificationUtils.ts

import { Notification, Spinner } from 'kintone-ui-component';

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
  const spinner = new Spinner({
    text: text,
    container: document.body
  });
  spinner.open();
  return spinner;
};