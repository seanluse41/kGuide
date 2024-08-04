// licenseUtils.ts

const PLUGIN_ID = kintone.$PLUGIN_ID;

export function validateLicenseKey(customerSecretKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const baseUrl = 'https://sean.kintone.com/k/v1/records.json';
    const query = encodeURIComponent(`secretKey = "${customerSecretKey}"`);
    const url = `${baseUrl}?app=140&query=${query}`;
    const method = 'GET';
    const headers = {
      'X-Cybozu-API-Token': 'kAf4eNyvCM1FSgUqmtsaOHDJ9297DyCcPcf2jmQA'
    };

    kintone.plugin.app.proxy(PLUGIN_ID, url, method, headers, {}, (resp) => {
      // Success callback
      try {
        const response = JSON.parse(resp);
        if (response.records.length === 0) {
          resolve(false);
          return;
        }

        const record = response.records[0];
        const validToDateString = record.validToDate.value;
        const validToDate = new Date(validToDateString);
        validToDate.setUTCHours(23, 59, 59, 999);

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        resolve(validToDate >= today);
      } catch (error) {
        console.error('Error parsing response:', error);
        reject(error);
      }
    }, (error) => {
      // Failure callback
      console.error('Error validating license:', error);
      reject(error);
    });
  });
}