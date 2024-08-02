import { Button } from 'kintone-ui-component/lib/button';
import { Dialog } from 'kintone-ui-component';
import { driver, DriveStep } from "driver.js";
import { CustomElementPicker } from './ElementPicker';
import { SideMenu } from './SideMenu';
import { getGuideSteps } from './GuideSteps';

const PLUGIN_ID = kintone.$PLUGIN_ID;

kintone.events.on("app.record.create.show", () => {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  console.log(config)
  const header = kintone.app.record.getHeaderMenuSpaceElement();
  // @ts-ignore
  let permissions = kintone.app.getPermissions()
  if (header === null) {
    throw new Error("The header element is unavailable on this page");
  }

  header.classList.add('guide-header');

  const sideMenu = new SideMenu();
  const elementPicker = new CustomElementPicker({ style: { borderColor: "#0000ff" } });

  const guideButton = new Button({
    text: 'Start Guide',
    type: 'submit',
  });
  guideButton.addEventListener('click', async () => {
    let steps: DriveStep[] | null = await getGuideSteps();
    if (steps === null) {
      showNoGuideDialog();
    } else {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        steps: steps
      });
      driverObj.drive();
    }
  });

  const createButton = new Button({
    text: 'Create Guide',
    type: 'submit',
    className: 'guide-button2'
  });
  createButton.addEventListener('click', () => {
    showCreateGuideDialog();
  });

  function showNoGuideDialog() {
    const okButton = new Button({
      text: 'Create New Guide',
      type: 'submit'
    });
    const cancelButton = new Button({
      text: 'Cancel',
      type: 'normal'
    });

    okButton.addEventListener('click', () => {
      noGuideDialog.close();
      startGuideCreation();
    });

    cancelButton.addEventListener('click', () => {
      noGuideDialog.close();
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const noGuideDialog = new Dialog({
      title: 'No Guide Exists',
      content: '<div>There is no guide created for this app yet. Would you like to create one?</div>',
      footer: footerDiv,
      header: '<div>No Guide Found</div>',
      icon: 'info',
      container: document.body,
      footerVisible: true
    });

    noGuideDialog.open();
  }

  function showCreateGuideDialog() {
    const okButton = new Button({
      text: 'Create New Guide',
      type: 'submit'
    });
    const cancelButton = new Button({
      text: 'Cancel',
      type: 'normal'
    });

    okButton.addEventListener('click', () => {
      createGuideDialog.close();
      startGuideCreation();
    });

    cancelButton.addEventListener('click', () => {
      createGuideDialog.close();
    });

    const footerDiv = document.createElement('div');
    footerDiv.appendChild(okButton);
    footerDiv.appendChild(cancelButton);

    const createGuideDialog = new Dialog({
      title: 'Create New Tour?',
      content: '<div>Any Existing Tours will be Overwritten.</div>',
      footer: footerDiv,
      header: '<div>Create New Tour?</div>',
      icon: 'warning',
      container: document.body,
      footerVisible: true
    });

    createGuideDialog.open();
  }

  function startGuideCreation() {
    sideMenu.show();
    elementPicker.start({
      onHover: (el: HTMLElement) => {
        const parentElement = elementPicker.getParentFieldElement(el);
        elementPicker.highlightElement(parentElement);
      },
      onClick: (el: HTMLElement) => {
        const parentElement = elementPicker.getParentFieldElement(el);
        if (parentElement) {
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
  }

  header.appendChild(guideButton);
  if (permissions.editApp == true) {
    header.appendChild(createButton);
  }
});