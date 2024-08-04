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
  let appCreateResponse = await createRepositoryApp()
  console.log(appCreateResponse)
})

const createRepositoryApp = async () => {
  try {
    // Step 1: Create the app
    const createAppBody = {
      name: "Guide Repository",
      description: "Repository for storing guide steps for various apps"
    };

    const createAppResponse = await kintone.api(kintone.api.url('/k/v1/preview/app.json', true), 'POST', createAppBody);
    console.log('App created successfully:', createAppResponse);

    const newAppId = createAppResponse.app;

    // Step 2: Add all fields at once
    const addFieldsBody = {
      app: newAppId,
      properties: {
        id: {
          type: 'SINGLE_LINE_TEXT',
          code: 'id',
          label: 'App ID',
          noLabel: false,
          required: true,
          unique: true
        },
        stepsTable: {
          type: 'SUBTABLE',
          code: 'stepsTable',
          label: 'Guide Steps',
          fields: {
            number: {
              type: 'NUMBER',
              code: 'number',
              label: 'Step Number',
              noLabel: false,
              required: true,
            },
            field: {
              type: 'SINGLE_LINE_TEXT',
              code: 'field',
              label: 'Field',
              noLabel: false,
              required: true
            },
            title: {
              type: 'SINGLE_LINE_TEXT',
              code: 'title',
              label: 'Title',
              noLabel: false,
              required: false
            },
            description: {
              type: 'MULTI_LINE_TEXT',
              code: 'description',
              label: 'Description',
              noLabel: false,
              required: false
            },
            position: {
              type: 'DROP_DOWN',
              code: 'position',
              label: 'Position',
              noLabel: false,
              required: false,
              defaultValue: "right",
              options: {
                right: { label: 'right', index: 0 },
                left: { label: 'left', index: 1 },
                top: { label: 'top', index: 2 },
                bottom: { label: 'bottom', index: 3 }
              }
            }
          }
        }
      }
    };

    const addFieldsResponse = await kintone.api(kintone.api.url('/k/v1/preview/app/form/fields.json', true), 'POST', addFieldsBody);
    console.log('Fields added successfully:', addFieldsResponse);

    // Step 3: Deploy the app
    const deployBody = {
      apps: [{ app: newAppId }]
    };

    await kintone.api(kintone.api.url('/k/v1/preview/app/deploy.json', true), 'POST', deployBody);
    console.log('App deployed successfully');

    // Update the plugin config with the new app ID
    const newConfig = { ...config, message: newAppId.toString() };
    await new Promise<void>((resolve) => {
      kintone.plugin.app.setConfig(newConfig, () => resolve());
    });

    console.log('Plugin config updated with new app ID');

    // Show success message
    await showConfigDialog(
      'Repository Created',
      `A new repository app has been created with ID: ${newAppId}. The plugin config has been updated.`,
      'Success',
      'success'
    );

    // Reload the page to reflect the new config
    location.reload();

  } catch (error) {
    console.error('Error creating repository app:', error);
    await showConfigDialog(
      'Error',
      'An error occurred while creating the repository app. Please check the console for more details.',
      'Error',
      'error'
    );
  }
};