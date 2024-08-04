// licenseUtils.ts

import { KintoneRestAPIClient } from "@kintone/rest-api-client";

interface KintoneField {
  type: string;
  value: any;
}

interface KintoneRecord {
  $id: KintoneField;
  $revision: KintoneField;
  [key: string]: KintoneField;
}

interface LicenseRecord {
  secretKey: KintoneField & { value: string };
  validToDate: KintoneField & { value: string };
}

function isLicenseRecord(record: KintoneRecord): record is LicenseRecord & KintoneRecord {
  return (
    'secretKey' in record &&
    'validToDate' in record &&
    typeof record.secretKey.value === 'string' &&
    typeof record.validToDate.value === 'string'
  );
}

export async function validateLicenseKey(customerSecretKey: string): Promise<boolean> {
  const client = new KintoneRestAPIClient({
    baseUrl: "https://sean.kintone.com",
    auth: { apiToken: 'kAf4eNyvCM1FSgUqmtsaOHDJ9297DyCcPcf2jmQA' } // Replace with your actual API token
  });

  try {
    const query = `secretKey = "${customerSecretKey}"`;
    const { records } = await client.record.getRecords({
      app: "140",
      query: query,
      totalCount: true
    });

    if (records.length === 0) {
      // No matching record found
      return false;
    }

    const record = records[0] as KintoneRecord;

    if (!isLicenseRecord(record)) {
      console.error('Invalid record structure:', record);
      return false;
    }

    // Extract the validToDate
    const validToDateString = record.validToDate.value;

    // Convert validToDate string to Date object
    const validToDate = new Date(validToDateString);
    validToDate.setUTCHours(23, 59, 59, 999); // Set to end of day in UTC

    // Get today's date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to start of day in UTC

    // Compare dates
    return validToDate >= today;

  } catch (error) {
    console.error('Error validating license:', error);
    throw error;
  }
}