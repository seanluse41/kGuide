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

interface SelectedElement {
  element: HTMLElement;
  label: string;
  title: string;
  description: string;
}

let currentHighlightedElement: HTMLElement | null = null;
let selectedElements: SelectedElement[] = [];

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
  const sideMenu = createSideMenu();

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


  // Header create button
  const createButton = new Button({
    text: 'Create Guide',
    type: 'submit'
  });
  createButton.addEventListener('click', async (clickEvent) => {
    dialog.open()
  });

  // Create OK and Cancel buttons for create dialogue
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
    showSideMenu(sideMenu);
    selectedElements = []; // Clear previously selected elements
    updateSelectedElementsList();

    picker.start({
      onHover: (el: HTMLElement) => {
        const parentElement = getParentFieldElement(el);
        highlightElement(parentElement);
      },
      onClick: (el: HTMLElement) => {
        const parentElement = getParentFieldElement(el);
        if (parentElement) {
          console.log(parentElement);
          addElementToSideMenu(parentElement); // This line is now safe
        } else {
          console.log("No parent field element found");
        }
        highlightElement(null);
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

// Side Menu Stuff

const createSideMenu = () => {
  const sideMenu = document.createElement('div');
  sideMenu.id = 'guide-side-menu';
  sideMenu.innerHTML = `
    <h2>Create Guide</h2>
    <div id="selected-elements-list" class="scrollable-list"></div>
  `;
  document.body.appendChild(sideMenu);

  // Add close button
  const closeButton = new Button({
    text: 'Close',
    type: 'normal'
  });
  closeButton.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    selectedElements = []; // Clear the selected elements when closing
    updateSelectedElementsList();
  });
  sideMenu.appendChild(closeButton);

  // Add finish button
  const finishButton = new Button({
    text: 'Finish Guide Creation',
    type: 'submit'
  });
  finishButton.addEventListener('click', () => {
    const newGuideSteps = prepareNewGuideSteps();
    console.log('New guide steps:', newGuideSteps);
    // Here you can process the new guide steps as needed
    sideMenu.classList.remove('open');
  });
  sideMenu.appendChild(finishButton);

  return sideMenu;
};

const showSideMenu = (sideMenu: HTMLElement) => {
  sideMenu.classList.add('open');
};

const addElementToSideMenu = (element: HTMLElement) => {
  const label = getElementLabel(element);
  selectedElements.push({ element, label, title: '', description: '' });
  updateSelectedElementsList();
};

const getElementLabel = (element: HTMLElement): string => {
  const labelElement = element.querySelector('.control-label-text-gaia');
  return labelElement ? labelElement.textContent || 'No Label' : 'No Label';
};

const updateSelectedElementsList = () => {
  const listContainer = document.getElementById('selected-elements-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  selectedElements.forEach((item, index) => {
    const listItem = document.createElement('div');
    listItem.classList.add('selected-element-item');
    listItem.innerHTML = `
      <div>${index + 1}. ${item.label}</div>
      <input type="text" class="title-input" placeholder="Enter title" value="${item.title}" data-index="${index}">
      <textarea class="description-input" placeholder="Enter description" data-index="${index}">${item.description}</textarea>
      <button class="remove-element" data-index="${index}">Remove</button>
    `;
    listContainer.appendChild(listItem);
  });

  // Add event listeners to inputs and remove buttons
  listContainer.querySelectorAll('.title-input, .description-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      const field = (e.target as HTMLElement).classList.contains('title-input') ? 'title' : 'description';
      selectedElements[index][field] = (e.target as HTMLInputElement).value;
    });
  });

  const removeButtons = listContainer.getElementsByClassName('remove-element');
  Array.from(removeButtons).forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      selectedElements.splice(index, 1);
      updateSelectedElementsList();
    });
  });
};

const prepareNewGuideSteps = (): {index: number, element: HTMLElement, title: string, description: string}[] => {
  return selectedElements.map(({ element, title, description }, index) => ({ 
    index,
    element, 
    title, 
    description 
  }));
};