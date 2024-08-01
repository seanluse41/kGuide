// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { Button } from 'kintone-ui-component/lib/button';
import { Dialog } from 'kintone-ui-component';
import { driver } from "driver.js";
const PLUGIN_ID = kintone.$PLUGIN_ID;
import { ElementPicker } from "pick-dom-element";

const style = { borderColor: "#0000ff" };
const picker = new ElementPicker({ style });

interface StepObject {
  element: string;
  popover: {
    title: string;
    description: string;
    side: string;
    align: string;
  };
}

const getGuideSteps = async (): Promise<StepObject[]> => {
  const query = `id = "${kintone.app.getId()}"`;
  const url = kintone.api.url('/k/v1/records.json', true) + '?app=128&query=' + query;

  try {
    const response = await kintone.api(url, 'GET', {});
    // Assuming there's only one record and it contains the stepsTable
    const record = response.records[0];
    const steps: StepObject[] = record.stepsTable.value.map((step: any) => ({
      element: step.value.field.value,
      popover: {
        title: step.value.title.value,
        description: step.value.description.value,
        side: step.value.position.value,
        align: "end" // You might want to make this configurable if needed
      }
    }));
    return steps;
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error to be handled by the caller
  }
};


const filterElementWithoutFieldClass = (el: HTMLElement): boolean => {
  const pattern = /^field-\d{5,9}$/;
  const pattern2 = /^label-\d{5,9}$/;
  const pattern3 = /^value-\d{5,9}$/;

  for (const className of Array.from(el.classList)) { // Convert to array first
    if (pattern.test(className)) {
      return true; 
    } else if (pattern2.test(className)) {
      return true;
    } else if (pattern3.test(className)) {
      return true;
    }
  }
  return false; 
};

kintone.events.on("app.record.create.show", () => {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const header = kintone.app.record.getHeaderMenuSpaceElement();
  if (header === null) {
    throw new Error("The header element is unavailable on this page");
  }
  const guideButton = new Button({
    text: 'Start Guide',
    type: 'submit'
  });
  guideButton.addEventListener('click', async (clickEvent) => {
    let stepsObject: Array<object> = await getGuideSteps() 
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: stepsObject
    });
    driverObj.drive();
  });

  const createButton = new Button({
    text: 'Create Guide',
    type: 'submit'
  });
  createButton.addEventListener('click', async (clickEvent) => {
    dialog.open()
  });

  // Create OK and Cancel buttons
  const okButton = new Button({
    text: 'Create New Guide',
    type: 'submit'
  });
  const cancelButton = new Button({
    text: 'Cancel',
    type: 'normal'
  });

  okButton.addEventListener('click', () => {
    dialog.close()
    picker.start({
      onHover: (el) => console.log(`Hover: ${el}`),
      onClick: (el) => {
        let currentElement = el;
        console.log(currentElement)
        picker.stop();
      },
      elementFilter: (el) => {
        if (filterElementWithoutFieldClass(el)) {
          return true;
        }
        return false
      }
    });
  });
  cancelButton.addEventListener('click', () => {
    dialog.close()
  });

  // Wrap OK and Cancel buttons with a div
  const divEl = document.createElement('div');
  divEl.appendChild(okButton);
  divEl.appendChild(cancelButton);

  const dialog = new Dialog({
    title: 'Create New Tour?',
    content: '<div>Any Existing Tours will be Overwritten.</div>',
    footer: divEl,
    header: '<div>Create New Tour?</div>',
    icon: 'warning',
    container: document.body,
    footerVisible: true
  });

  dialog.addEventListener('close', clickEvent => {
    console.log(clickEvent);
  });

  header.appendChild(guideButton);
  header.appendChild(createButton);
});
