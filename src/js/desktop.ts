// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { Button } from 'kintone-ui-component/lib/button';
import { Dialog } from 'kintone-ui-component';
import { driver } from "driver.js";
const PLUGIN_ID = kintone.$PLUGIN_ID;
import { ElementPicker } from "pick-dom-element";


interface StepObject {
  element: string;
  popover: {
    title: string;
    description: string;
    side: string;
    align: string;
  };
}

interface ElementPickerOptions {
  style?: {
    borderColor: string;
  };
  highlightedElement?: (el: HTMLElement) => HTMLElement | null;
}

let currentHighlightedElement: HTMLElement | null = null;

const highlightElement = (el: HTMLElement | null) => {
  if (currentHighlightedElement) {
    currentHighlightedElement.style.outline = '';
  }
  if (el) {
    el.style.outline = `2px solid ${style.borderColor}`;
    currentHighlightedElement = el;
  } else {
    currentHighlightedElement = null;
  }
};

const style = { borderColor: "#0000ff" };
const picker = new ElementPicker({
  style,
} as ElementPickerOptions);


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


const getParentFieldElement = (el: HTMLElement): HTMLElement | null => {
  const pattern = /^field-\d{5,9}$/;
  let currentElement: HTMLElement | null = el;

  while (currentElement) {
    if (Array.from(currentElement.classList).some(className => pattern.test(className))) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }

  return null;
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
      onHover: (el: HTMLElement) => {
        const parentElement = getParentFieldElement(el);
        highlightElement(parentElement);
        if (parentElement) {
          console.log(`Hover: ${parentElement}`);
        }
      },
      onClick: (el: HTMLElement) => {
        const parentElement = getParentFieldElement(el);
        if (parentElement) {
          console.log(parentElement);
          // You can perform any other actions with the parent field element here
        } else {
          console.log("No parent field element found");
        }
        highlightElement(null);
        picker.stop();
      },
      elementFilter: (el: HTMLElement) => {
        return getParentFieldElement(el) !== null;
      }
    });
  })
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
