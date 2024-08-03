// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { showConfigDialog } from './components/dialogUtils';

const PLUGIN_ID = kintone.$PLUGIN_ID;

const form = document.querySelector(".js-submit-settings");
const cancelButton = document.querySelector(".js-cancel-button");
const createRepositoryButton = document.getElementById("create-repository-button");

const messageInput =
  document.querySelector<HTMLInputElement>(".js-text-message");
if (!(form && cancelButton && messageInput)) {
  throw new Error("Required elements do not exist.");
}
const config = kintone.plugin.app.getConfig(PLUGIN_ID);

if (config.message) {
  messageInput.value = config.message;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  kintone.plugin.app.setConfig({ message: messageInput.value }, () => {
    alert("The plug-in settings have been saved. Please update the app!");
    window.location.href = "../../flow?app=" + kintone.app.getId();
  });
});
cancelButton.addEventListener("click", () => {
  window.location.href = "../../" + kintone.app.getId() + "/plugin/";
});

createRepositoryButton?.addEventListener("click", async () => {
  console.log("creating repository app...")
  let appCreateResponse = await createRepositoryApp()
  console.log(appCreateResponse)
})

const createRepositoryApp = async () => {
  // Create Kintone App Flow Starts here.
  const repositoryAppId = config.message;

  if (!repositoryAppId) {
    console.error("Repository App ID is not set in the plugin config.");
    return;
  }

  try {
    // Check if the app exists
    const response = await kintone.api(kintone.api.url('/k/v1/app', true), 'GET', {
      id: repositoryAppId
    });

    if (response && response.appId) {
      console.log(`Repository app with ID ${repositoryAppId} already exists.`);
      const shouldProceed = await showConfigDialog(
        'Repository May Exist',
        'A repository app with the specified ID already exists. Do you want to create a new one?',
        'Repository Existence Warning',
        'warning'
      );
      if (!shouldProceed) {
        console.log('User cancelled repository creation.');
        return;
      }
    }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'GAIA_AP01') {
        console.log(`App with ID ${repositoryAppId} does not exist.`);
        const shouldProceed = await showConfigDialog(
          'Repository Does Not Exist',
          `An app with ID ${repositoryAppId} does not exist. Do you want to create a new repository app?`,
          'Repository Not Found',
          'info'
        );
        if (!shouldProceed) {
          console.log('User cancelled repository creation.');
          return;
        }
      } else {
        console.error('Error checking for existing app:', error);
        return;
      }
    } else {
      console.error('An unknown error occurred:', error);
      return;
    }
  }

  // If we reach here, it means we should proceed with app creation
  console.log('Proceeding with repository app creation...');
  // Add app creation logic here
};
