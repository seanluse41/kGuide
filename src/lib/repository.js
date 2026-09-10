/**
 * Reads and writes guide definitions in the kGuide repository app.
 *
 * The repository app ID is passed in rather than read from the plugin config at
 * import time (as it used to be), so the config screen and the record page can
 * both use these helpers.
 */

const recordsUrl = (repositoryAppId, appId) =>
  `${kintone.api.url('/k/v1/records.json', true)}?app=${repositoryAppId}&query=${encodeURIComponent(
    `id = "${appId}"`
  )}`;

const fetchGuideRecord = async (repositoryAppId, appId) => {
  const { records } = await kintone.api(recordsUrl(repositoryAppId, appId), 'GET', {});
  return records[0] || null;
};

/**
 * Callers report failures themselves, so these throw rather than notifying.
 *
 * @returns {Promise<Array|null>} driver.js steps, or null when no guide exists
 * for this app yet (an empty array means a guide exists but has no steps).
 */
export const getGuideSteps = async (repositoryAppId, appId) => {
  const record = await fetchGuideRecord(repositoryAppId, appId);
  if (!record) {
    return null;
  }

  return record.stepsTable.value.map((row) => ({
    element: row.value.field.value,
    popover: {
      title: row.value.title.value,
      description: row.value.description.value,
      side: row.value.position.value,
      align: 'end',
    },
  }));
};

/** Creates or overwrites this app's guide. */
export const saveGuideSteps = async (repositoryAppId, appId, steps) => {
  const stepsTable = steps.map((step, index) => ({
    value: {
      number: { value: index + 1 },
      field: { value: step.element },
      title: { value: step.popover?.title || '' },
      description: { value: step.popover?.description || '' },
      position: { value: step.popover?.side || 'right' },
    },
  }));

  const existing = await fetchGuideRecord(repositoryAppId, appId);
  const url = kintone.api.url('/k/v1/record.json', true);

  if (existing) {
    await kintone.api(url, 'PUT', {
      app: repositoryAppId,
      id: existing.$id.value,
      record: { stepsTable: { value: stepsTable } },
    });
  } else {
    await kintone.api(url, 'POST', {
      app: repositoryAppId,
      record: {
        id: { value: String(appId) },
        stepsTable: { value: stepsTable },
      },
    });
  }
};
