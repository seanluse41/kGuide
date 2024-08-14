// versionUtils.ts

const PLUGIN_ID = kintone.$PLUGIN_ID;

export async function getPluginVersion(): Promise<string> {
  try {
    const resp = await kintone.api(kintone.api.url('/k/v1/plugins.json', true), 'GET', {});
    const plugin = resp.plugins.find((p: any) => p.id === PLUGIN_ID);
    if (plugin) {
      return plugin.version;
    } else {
      throw new Error('Plugin not found');
    }
  } catch (error) {
    console.error('Error fetching plugin version:', error);
    throw error;
  }
}