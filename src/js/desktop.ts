// desktop.ts

import { showNoGuideDialog, showCreateGuideDialog } from './components/dialogUtils';
import { createGuideButton, createCreateButton } from './components/buttonUtils';
import { showErrorNotification } from './components/notificationUtils';
import { driver, DriveStep } from "driver.js";
import { CustomElementPicker } from './ElementPicker';
import { SideMenu } from './SideMenu';
import { getGuideSteps } from './GuideSteps';
import { FieldLayout, SectionLayout, AppLayout } from './types';
import { setupI18n } from '../i18n'

const PLUGIN_ID = kintone.$PLUGIN_ID;

kintone.events.on("app.record.create.show", async () => {
  const i18n = await setupI18n();
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

  const guideButton = createGuideButton(i18n.t('startGuide'));
  guideButton.addEventListener('click', async () => {
    let steps: DriveStep[] | null = await getGuideSteps();
    if (steps === null) {
      const shouldCreateGuide = await showNoGuideDialog();
      if (shouldCreateGuide) {
        startGuideCreation();
      }
    } else if (steps.length == 0) {
      await showErrorNotification(i18n.t('noStepsInGuide'));
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

  const createButton = createCreateButton(i18n.t('createGuide'));
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