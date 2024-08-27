import { setupI18n } from "../i18n";
import { showErrorNotification } from "./components/notificationUtils";
import { showConfigDialog } from "./components/dialogUtils";
import { getPluginVersion } from "./components/versionUtils";

const PLUGIN_ID = kintone.$PLUGIN_ID;

const translateConfigHtml = async () => {
  const i18n = await setupI18n();

  const elements = {
    settingsForKGuide: document.querySelector(".settings-heading"),
    pleaseInputAppId: document.querySelectorAll(".kintoneplugin-desc")[0],
    ifRepositoryNotExist: document.querySelectorAll(".kintoneplugin-desc")[1],
    repositoryAppId: document.querySelector('label[for="message"]'),
    secretKey: document.querySelector('label[for="secretKey"]'),
    allowNonAdminGuideCreation: document.querySelector('label[for="nonAdminGuideCreation"]'),
    createRepositoryApp: document.getElementById("create-repository-button"),
    stripeCustomerPortal: document.getElementById("stripe-customer-portal-button"),
    contactSupport: document.getElementById("contact-support-button"),
    cancel: document.querySelector(".js-cancel-button"),
    save: document.querySelector(
      ".kintoneplugin-button-dialog-ok:not(#create-repository-button):not(#stripe-customer-portal-button):not(#contact-support-button)",
    ),
  };

  for (const [key, element] of Object.entries(elements)) {
    if (element) {
      if (key === "repositoryAppId" || key === "secretKey") {
        const labelText = element.childNodes[0];
        if (labelText.nodeType === Node.TEXT_NODE) {
          labelText.textContent = i18n.t(key);
        }
      } else if (key === "allowNonAdminGuideCreation") {
        element.childNodes[3].textContent = i18n.t(key);
      } else {
        element.textContent = i18n.t(key);
      }
    }
  }
};

(async () => {
  const i18n = await setupI18n();
  await translateConfigHtml();
  const form = document.querySelector<HTMLFormElement>(".js-submit-settings");
  const cancelButton =
    document.querySelector<HTMLButtonElement>(".js-cancel-button");
  const createRepositoryButton = document.getElementById(
    "create-repository-button",
  );
  const stripeCustomerPortalButton = document.getElementById("stripe-customer-portal-button");
  const contactSupportButton = document.getElementById("contact-support-button");
  const messageInput =
    document.querySelector<HTMLInputElement>("#repository-appid");
  const secretKeyInput = document.querySelector<HTMLInputElement>("#secretKey");
  const nonAdminGuideCreationCheckbox = document.querySelector<HTMLInputElement>("#nonAdminGuideCreation");

  if (!(form && cancelButton && messageInput && secretKeyInput && nonAdminGuideCreationCheckbox)) {
    throw new Error(i18n.t("requiredElementsNotFound"));
  }

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);

  if (config.message) {
    messageInput.value = config.message;
  }
  if (config.secretKey) {
    secretKeyInput.value = config.secretKey;
  }
  if (config.nonAdminGuideCreation) {
    nonAdminGuideCreationCheckbox.checked = config.nonAdminGuideCreation === "true";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    kintone.plugin.app.setConfig(
      {
        message: messageInput.value,
        secretKey: secretKeyInput.value,
        nonAdminGuideCreation: nonAdminGuideCreationCheckbox.checked.toString()
      },
      () => {
        alert(i18n.t("pluginSettingsSaved"));
        window.location.href = "../../flow?app=" + kintone.app.getId();
      },
    );
  });

  cancelButton.addEventListener("click", () => {
    window.location.href = "../../" + kintone.app.getId() + "/plugin/";
  });

  createRepositoryButton?.addEventListener("click", async () => {
    const shouldCreate = await showConfigDialog(
      i18n.t("createRepositoryConfirmTitle"),
      i18n.t("createRepositoryConfirmContent"),
      i18n.t("confirmationRequired"),
      "info"
    );

    if (shouldCreate) {
      const appCreateResponse = await createRepositoryApp();
    }
  });

  stripeCustomerPortalButton?.addEventListener("click", () => {
    window.open("https://billing.stripe.com/p/login/00g9DZb7Dedw4lWaEE", "_blank");
  });

  contactSupportButton?.addEventListener("click", async () => {
    try {
      const currentVersion = await getPluginVersion();
      const subject = encodeURIComponent(i18n.t("supportEmailSubject"));
      const body = encodeURIComponent(i18n.t("supportEmailBody", { version: currentVersion }));
      window.location.href = `mailto:admin@seanbase.com?subject=${subject}&body=${body}`;
    } catch (error) {
      showErrorNotification(i18n.t("errorFetchingPluginVersion"));
    }
  });

  async function createRepositoryApp() {
    try {
      // Step 1: Create the app
      const createAppBody = {
        name: i18n.t("guideRepositoryName"),
        description: i18n.t("guideRepositoryDescription"),
      };

      const createAppResponse = await kintone.api(
        kintone.api.url("/k/v1/preview/app.json", true),
        "POST",
        createAppBody,
      );

      const newAppId = createAppResponse.app;

      const addFieldsBody = {
        app: newAppId,
        properties: {
          id: {
            type: "SINGLE_LINE_TEXT",
            code: "id",
            label: "App ID",
            noLabel: false,
            required: true,
            unique: true,
          },
          stepsTable: {
            type: "SUBTABLE",
            code: "stepsTable",
            label: "Guide Steps",
            fields: {
              number: {
                type: "NUMBER",
                code: "number",
                label: "Step Number",
                noLabel: false,
                required: true,
              },
              field: {
                type: "SINGLE_LINE_TEXT",
                code: "field",
                label: "Field",
                noLabel: false,
                required: true,
              },
              title: {
                type: "SINGLE_LINE_TEXT",
                code: "title",
                label: "Title",
                noLabel: false,
                required: false,
              },
              description: {
                type: "MULTI_LINE_TEXT",
                code: "description",
                label: "Description",
                noLabel: false,
                required: false,
              },
              position: {
                type: "DROP_DOWN",
                code: "position",
                label: "Position",
                noLabel: false,
                required: false,
                defaultValue: "right",
                options: {
                  right: { label: "right", index: 0 },
                  left: { label: "left", index: 1 },
                  top: { label: "top", index: 2 },
                  bottom: { label: "bottom", index: 3 },
                },
              },
            },
          },
        },
      };

      const addFieldsResponse = await kintone.api(
        kintone.api.url("/k/v1/preview/app/form/fields.json", true),
        "POST",
        addFieldsBody,
      );

      // Step 3: Deploy the app
      const deployBody = {
        apps: [{ app: newAppId }],
      };

      await kintone.api(
        kintone.api.url("/k/v1/preview/app/deploy.json", true),
        "POST",
        deployBody,
      );

      // Update the plugin config with the new app ID
      const newConfig = { ...config, message: newAppId.toString() };
      await new Promise<void>((resolve) => {
        kintone.plugin.app.setConfig(newConfig, () => resolve());
      });

      // Show success message
      await showConfigDialog(
        i18n.t("repositoryCreatedTitle"),
        i18n.t("repositoryCreatedMessage", { appId: newAppId }),
        i18n.t("successLabel"),
        "success",
      );

      // Reload the page to reflect the new config
      location.reload();
    } catch (error) {
      await showErrorNotification(i18n.t("errorCreatingRepositoryMessage"));
      await showConfigDialog(
        i18n.t("errorLabel"),
        i18n.t("errorCreatingRepositoryMessage"),
        i18n.t("errorLabel"),
        "error",
      );
    }
  }
})();
