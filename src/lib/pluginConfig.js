export const PLUGIN_ID = kintone.$PLUGIN_ID;

export const getConfig = () => {
  const raw = kintone.plugin.app.getConfig(PLUGIN_ID) || {};
  return {
    repositoryAppId: raw.message || '',
    secretKey: raw.secretKey || '',
    nonAdminGuideCreation: raw.nonAdminGuideCreation === 'true',
  };
};

export const setConfig = (config) =>
  new Promise((resolve) => {
    kintone.plugin.app.setConfig(
      {
        // `message` is the manifest's required_param, so the app-id keeps that name
        message: config.repositoryAppId,
        secretKey: config.secretKey,
        nonAdminGuideCreation: String(config.nonAdminGuideCreation),
      },
      resolve
    );
  });
