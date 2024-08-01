// GuideSteps.ts

import { DriveStep } from 'driver.js';

export async function getGuideSteps(): Promise<DriveStep[]> {
  const query = `id = "${kintone.app.getId()}"`;
  const url = kintone.api.url('/k/v1/records.json', true) + '?app=128&query=' + query;

  try {
    const response = await kintone.api(url, 'GET', {});
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
    console.error(error);
    throw error;
  }
}