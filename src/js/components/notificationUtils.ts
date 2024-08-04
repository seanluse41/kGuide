// src/components/notificationUtils.ts

import { Notification, Spinner } from 'kintone-ui-component';
import { setupI18n } from '../../i18n';

export const showErrorNotification = async (message?: string) => {
  const i18n = await setupI18n();
  const errorNotification = new Notification({
    text: message || i18n.t('error'),
    type: 'danger',
    className: 'options-class',
    duration: 2000,
    container: document.body
  });
  errorNotification.open();
};

export const showSuccessNotification = async (message?: string) => {
  const i18n = await setupI18n();
  const successNotification = new Notification({
    text: message || i18n.t('success'),
    type: 'success',
    className: 'options-class',
    duration: 2000,
    container: document.body
  });
  successNotification.open();
};

export const showSpinner = async (text?: string) => {
  const i18n = await setupI18n();
  const spinner = new Spinner({
    text: text || i18n.t('loading'),
    container: document.body
  });
  spinner.open();
  return spinner;
};