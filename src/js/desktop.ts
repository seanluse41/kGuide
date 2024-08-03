import { showNoGuideDialog, showCreateGuideDialog } from './components/dialogUtils';
import { showErrorNotification } from './components/notificationUtils';
import { Button } from 'kintone-ui-component';
import { driver, DriveStep } from "driver.js";
import { CustomElementPicker } from './ElementPicker';
import { SideMenu } from './SideMenu';
import { getGuideSteps } from './GuideSteps';
import { FieldLayout, SectionLayout, AppLayout } from './types';

const PLUGIN_ID = kintone.$PLUGIN_ID;

kintone.events.on("app.record.create.show", () => {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const header = kintone.app.record.getHeaderMenuSpaceElement();
  // @ts-ignore
  let permissions = kintone.app.getPermissions()
  if (header === null) {
    throw new Error("The header element is unavailable on this page");
  }

  header.classList.add('guide-header');

  const elementPicker = new CustomElementPicker({ style: { borderColor: "#0000ff" } });
  const sideMenu = new SideMenu(elementPicker);

  const guideButton = new Button({
    text: 'Start Guide',
    type: 'submit',
  });
  guideButton.addEventListener('click', async () => {
    let steps: DriveStep[] | null = await getGuideSteps();
    if (steps === null) {
      const shouldCreateGuide = await showNoGuideDialog();
      if (shouldCreateGuide) {
        startGuideCreation();
      }
    } else if (steps.length == 0) {
      showErrorNotification()
    } else {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        steps: steps
      });
      openAllFieldGroups()
      driverObj.drive();
    }
  });

  const createButton = new Button({
    text: 'Create Guide',
    type: 'submit',
    className: 'guide-button2'
  });
  createButton.addEventListener('click', async () => {
    const shouldCreateGuide = await showCreateGuideDialog();
    if (shouldCreateGuide) {
      startGuideCreation();
    }
  });

  async function openAllFieldGroups() {
    try {
      const layout: AppLayout = await kintone.api(kintone.api.url('/k/v1/app/form/layout', true), 'GET', { app: kintone.app.getId() });
      const openGroups = (fields: FieldLayout[]) => {
        fields.forEach(field => {
          if (field.type === 'GROUP') {
            kintone.app.record.setGroupFieldOpen(field.code, true);
            if (field.layout) {
              openGroups(field.layout);
            }
          }
        });
      };
      layout.layout.forEach((section: SectionLayout) => {
        if (section.type === 'GROUP' && section.code) {
          kintone.app.record.setGroupFieldOpen(section.code, true);
        }
        if (section.fields) {
          openGroups(section.fields);
        }
      });
    } catch (error) {
      console.error('Error opening field groups:', error);
    }
  }

  async function startGuideCreation() {
    await openAllFieldGroups();
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