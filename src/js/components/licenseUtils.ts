import { showErrorNotification } from './notificationUtils';
import { t } from 'i18next';

const PLUGIN_ID = kintone.$PLUGIN_ID;
const LICENSE_TOKEN_KEY = `${PLUGIN_ID}_licenseToken`;
const TOKEN_EXPIRATION_KEY = `${PLUGIN_ID}_tokenExpiration`;
const TOKEN_CHECKSUM_KEY = `${PLUGIN_ID}_tokenChecksum`;

interface ValidationResponse {
  status: 'active' | 'expired';
  token?: string;
}

function decodeJwt(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function generateChecksum(token: string, expiration: string): string {
  const data = token + expiration;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

const storeToken = (token: string): void => {
  try {
    const decodedToken = decodeJwt(token);
    const expiration = decodedToken.exp.toString();
    const checksum = generateChecksum(token, expiration);

    localStorage.setItem(LICENSE_TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRATION_KEY, expiration);
    localStorage.setItem(TOKEN_CHECKSUM_KEY, checksum);
  } catch (error) {
    console.error('Error in storeToken:', error);
    throw error;
  }
};

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem(LICENSE_TOKEN_KEY);
  const expiration = localStorage.getItem(TOKEN_EXPIRATION_KEY);
  const storedChecksum = localStorage.getItem(TOKEN_CHECKSUM_KEY);
  
  if (!token || !expiration || !storedChecksum) {
    return false;
  }
  
  // Verify checksum
  const calculatedChecksum = generateChecksum(token, expiration);
  if (calculatedChecksum !== storedChecksum) {
    return false;
  }
  
  const expirationTime = parseInt(expiration, 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const isValid = currentTime < expirationTime;
  return isValid;
};

export async function validateLicenseKey(secretKey: string): Promise<boolean> {
  if (isTokenValid()) {
    return true;
  }

  const baseUrl = 'https://www.seanbase.com/validateLicense';
  const url = `${baseUrl}?secretKey=${encodeURIComponent(secretKey)}`;
  const method = 'GET';
  const headers = {
    'Content-Type': 'application/json',
    'Origin': window.location.origin
  };

  try {
    const [body, status, responseHeaders] = await kintone.plugin.app.proxy(PLUGIN_ID, url, method, headers, {});

    if (status === 200) {
      const responseData: ValidationResponse = JSON.parse(body);

      if (responseData.status === 'active' && responseData.token) {
        try {
          storeToken(responseData.token);
          return true;
        } catch (storeError) {
          console.error('Error storing token:', storeError);
          return false;
        }
      } else if (responseData.status === 'expired') {
        showErrorNotification(t('invalidOrExpiredLicense'));
        return false;
      }
    } else {
      console.error(`Request failed with status ${status}`);
      throw new Error(`Request failed with status ${status}`);
    }

    return false;
  } catch (error) {
    console.error('Error validating license:', error);
    showErrorNotification(t('errorValidatingLicense'));
    return false;
  }
}