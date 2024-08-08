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

function generateChecksum(data: string): string {
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
    console.log('Decoding JWT token');
    const decodedToken = decodeJwt(token);
    console.log('JWT token decoded successfully');

    const checksum = generateChecksum(token);

    localStorage.setItem(LICENSE_TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRATION_KEY, decodedToken.exp.toString());
    localStorage.setItem(TOKEN_CHECKSUM_KEY, checksum);
    console.log('Token and checksum stored in localStorage');
  } catch (error) {
    console.error('Error in storeToken:', error);
    throw error;
  }
};

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem(LICENSE_TOKEN_KEY);
  const expiration = localStorage.getItem(TOKEN_EXPIRATION_KEY);
  const storedChecksum = localStorage.getItem(TOKEN_CHECKSUM_KEY);
  
  console.log('Checking token validity from localStorage');
  
  if (!token || !expiration || !storedChecksum) {
    console.log('No token, expiration, or checksum found in localStorage');
    return false;
  }
  
  // Verify checksum
  const calculatedChecksum = generateChecksum(token);
  if (calculatedChecksum !== storedChecksum) {
    console.log('Token checksum mismatch, possible tampering detected');
    return false;
  }
  
  const expirationTime = parseInt(expiration, 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const isValid = currentTime < expirationTime;
  console.log(`Token validity: ${isValid}, Expiration: ${new Date(expirationTime)}, Current: ${new Date(currentTime)}`);
  return isValid;
};

export async function validateLicenseKey(secretKey: string): Promise<boolean> {
  if (isTokenValid()) {
    console.log('Existing token is still valid');
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
    console.log('Sending license validation request');
    const [body, status, responseHeaders] = await kintone.plugin.app.proxy(PLUGIN_ID, url, method, headers, {});
    console.log('License validation response received', { status, body });

    if (status === 200) {
      const responseData: ValidationResponse = JSON.parse(body);

      if (responseData.status === 'active' && responseData.token) {
        console.log('License is active, storing token');
        try {
          storeToken(responseData.token);
          console.log('Token stored successfully');
          return true;
        } catch (storeError) {
          console.error('Error storing token:', storeError);
          return false;
        }
      } else if (responseData.status === 'expired') {
        console.log('License is expired');
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