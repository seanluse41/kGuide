import { Button } from 'kintone-ui-component/lib/button';
import { Dialog } from 'kintone-ui-component';
import { Spinner } from 'kintone-ui-component';
import { driver, DriveStep } from "driver.js";
import { CustomElementPicker } from './ElementPicker';
import { SideMenu } from './SideMenu';
import { getGuideSteps } from './GuideSteps';

const PLUGIN_ID = kintone.$PLUGIN_ID;

kintone.events.on("app.record.create.show", () => {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const header = kintone.app.record.getHeaderMenuSpaceElement();
  if (header === null) {
    throw new Error("The header element is unavailable on this page");
  }

  const sideMenu = new SideMenu();
  const elementPicker = new CustomElementPicker({ style: { borderColor: "#0000ff" } });

  const spinner = new Spinner({
    text: 'ガイド更新中…',
    container: document.body
  });

  const guideButton = new Button({
    text: 'Start Guide',
    type: 'submit'
  });
  guideButton.addEventListener('click', async () => {
    let steps: DriveStep[] = await getGuideSteps();
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: steps
    });
    driverObj.drive();
  });

  const createButton = new Button({
    text: 'Create Guide',
    type: 'submit'
  });
  createButton.addEventListener('click', () => {
    dialog.open();
  });

  const okButton = new Button({
    text: 'Create New Guide',
    type: 'submit'
  });
  const cancelButton = new Button({
    text: 'Cancel',
    type: 'normal'
  });

  okButton.addEventListener('click', () => {
    dialog.close();
    sideMenu.show();
    elementPicker.start({
      onHover: (el: HTMLElement) => {
        const parentElement = elementPicker.getParentFieldElement(el);
        elementPicker.highlightElement(parentElement);
      },
      onClick: (el: HTMLElement) => {
        const parentElement = elementPicker.getParentFieldElement(el);
        if (parentElement) {
          console.log("Adding element to side menu:", parentElement);
          sideMenu.addElement(parentElement);
        } else {
          console.log("No parent field element found");
        }
        elementPicker.highlightElement(null);
      },
      elementFilter: (el: HTMLElement) => {
        return elementPicker.getParentFieldElement(el) !== null;
      }
    });
  });

  cancelButton.addEventListener('click', () => {
    dialog.close();
  });

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

  header.appendChild(guideButton);
  header.appendChild(createButton);
});