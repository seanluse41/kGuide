// GuideSteps.ts

import { DriveStep } from 'driver.js';
import { setupI18n } from '../i18n';
import { showErrorNotification } from './components/notificationUtils';
const PLUGIN_ID = kintone.$PLUGIN_ID;
const config = kintone.plugin.app.getConfig(PLUGIN_ID);
const repositoryAppID = config.message

export async function getGuideSteps(): Promise<DriveStep[] | null> {
  const i18n = await setupI18n();
  const query = `id = "${kintone.app.getId()}"`;
  const url = kintone.api.url('/k/v1/records.json', true) + `?app=${repositoryAppID}&query=` + encodeURIComponent(query);

  try {
    const response = await kintone.api(url, 'GET', {});
    if (response.records.length === 0) {
      return null; // No guide exists
    }
    const record = response.records[0];
    const steps: DriveStep[] = record.stepsTable.value.map((step: any) => ({
      element: step.value.field.value,
      popover: {
        title: step.value.title.value,
        description: step.value.description.value,
        side: step.value.position.value as 'top' | 'right' | 'bottom' | 'left',
        align: "end"
      }
    }));
    return steps;
  } catch (error) {
    await showErrorNotification(i18n.t('errorFetchingGuideSteps'));
    throw error;
  }
}

export async function saveGuideSteps(steps: DriveStep[], appId: string): Promise<void> {
  const i18n = await setupI18n();
  const query = `id = "${appId}"`;
  const getUrl = kintone.api.url('/k/v1/records.json', true) + `?app=${repositoryAppID}&query=` + encodeURIComponent(query);

  try {
    // Check if a record already exists
    const getResponse = await kintone.api(getUrl, 'GET', {});
    const stepsTableValue = steps.map((step, index) => ({
      value: {
        number: { value: index + 1},
        field: { value: step.element },
        title: { value: step.popover?.title || '' },
        description: { value: step.popover?.description || '' },
        position: { value: step.popover?.side || 'right' }
      }
    }));

    if (getResponse.records.length > 0) {
      // Update existing record
      const recordId = getResponse.records[0].$id.value;
      const putUrl = kintone.api.url('/k/v1/record.json', true);
      const putBody = {
        app: repositoryAppID,
        id: recordId,
        record: {
          stepsTable: { value: stepsTableValue }
        }
      };
      await kintone.api(putUrl, 'PUT', putBody);
    } else {
      // Create new record
      const postUrl = kintone.api.url('/k/v1/record.json', true);
      const postBody = {
        app: repositoryAppID,
        record: {
          id: { value: appId },
          stepsTable: { value: stepsTableValue }
        }
      };
      await kintone.api(postUrl, 'POST', postBody);
    }
  } catch (error) {
    await showErrorNotification(i18n.t('errorSavingGuideSteps'));
    throw error;
  }
}