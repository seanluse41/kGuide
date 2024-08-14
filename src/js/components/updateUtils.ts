// updateUtils.ts

import { showSuccessNotification, showErrorNotification } from "./notificationUtils";
import { showConfigDialog } from "./dialogUtils";
import { setupI18n } from "../../i18n";

const PLUGIN_ID = kintone.$PLUGIN_ID;

export async function checkForUpdates(currentVersion: string) {
  const i18n = await setupI18n();
  const baseUrl = "https://www.seanbase.com/getKguideUpdate";
  const url = `${baseUrl}?version=${encodeURIComponent(currentVersion)}`;
  const method = "GET";
  const headers = {
    "Content-Type": "application/json",
    Origin: window.location.origin,
  };

  try {
    const response = await kintone.plugin.app.proxy(
      PLUGIN_ID,
      url,
      method,
      headers,
      {}
    );

    // if (!response || response[1] !== 200) {
    //   throw new Error(`Request failed with status ${response ? response[1] : 'unknown'}`);
    // }
    // const responseData = JSON.parse(response[0]);

    let responseData = {
      current: true
    }

    if (responseData.current === true) {
      showSuccessNotification(i18n.t("alreadyUpToDate"));
    } else {
      const shouldUpdate = await showConfigDialog(
        i18n.t("updateAvailableTitle"),
        i18n.t("updateAvailableMessage"),
        i18n.t("updateAvailable"),
        "info"
      );

      if (shouldUpdate) {
        const subject = encodeURIComponent(i18n.t("updateRequestEmailSubject"));
        const body = encodeURIComponent(i18n.t("updateRequestEmailBody", { currentVersion }));
        window.location.href = `mailto:seanluse41@gmail.com?subject=${subject}&body=${body}`;
      }
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    showErrorNotification(i18n.t("errorCheckingForUpdates"));
  }
}