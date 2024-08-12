// desktop.ts

import { showNoGuideDialog, showCreateGuideDialog, showConfigDialog } from './components/dialogUtils';
import { createGuideButton, createCreateButton, createButton as createCustomButton } from './components/buttonUtils';
import { showErrorNotification } from './components/notificationUtils';
import { driver, DriveStep } from "driver.js";
import { CustomElementPicker } from './ElementPicker';
import { SideMenu } from './SideMenu';
import { getGuideSteps } from './GuideSteps';
import { FieldLayout, SectionLayout, AppLayout } from './types';
import { setupI18n } from '../i18n';
import { validateLicenseKey } from './components/licenseUtils';
import { initObservers } from './components/domUtils';

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

  let resizeObserver: ResizeObserver | null = null;
  let listboxKeydownListener: ((event: KeyboardEvent) => void) | undefined;

  let driverObj: any;

  const guideButton = createGuideButton(i18n.t('startGuide'));
  guideButton.addEventListener('click', async () => {
    try {
      const isLicenseValid = await validateLicenseKey(config.secretKey);
      if (!isLicenseValid) {
        await showConfigDialog(
          i18n.t('errorLabel'),
          i18n.t('invalidOrExpiredLicense'),
          i18n.t('errorLabel'),
          'error'
        );
        return;
      }

      let steps: DriveStep[] | null = await getGuideSteps();
      if (steps === null) {
        const shouldCreateGuide = await showNoGuideDialog();
        if (shouldCreateGuide) {
          startGuideCreation();
        }
      } else if (steps.length == 0) {
        await showErrorNotification(i18n.t('noStepsInGuide'));
      } else {
        await openAllFieldGroups();
        initTour(steps)
      }
    } catch (error) {
      console.error('Error validating license:', error);
      await showConfigDialog(
        i18n.t('errorLabel'),
        i18n.t('errorValidatingLicense'),
        i18n.t('errorLabel'),
        'error'
      );
    }
  });

  const initTour = async (steps: DriveStep[]) => {
    const i18n = await setupI18n();
    driverObj = driver({
      showProgress: true,
      progressText: i18n.t("progressText", { current: "{{current}}", total: "{{total}}" }),
      animate: true,
      steps: steps,
      popoverClass: "driver-popover-class",
      allowClose: false,
      nextBtnText: i18n.t("next"),
      prevBtnText: i18n.t("previous"),
      doneBtnText: i18n.t("finish"),
      onHighlightStarted: (element) => {
        if (element && element instanceof HTMLElement) {
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
          resizeObserver = new ResizeObserver(() => {
            if (driverObj) {
              driverObj.refresh();
            }
          });
          resizeObserver.observe(element);
        }
      },
      onDeselected: (element) => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      },
      onDestroyed: (element) => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (modalObserver) {
          modalObserver.disconnect();
        }
        if (modalCloseObserver) {
          modalCloseObserver.disconnect()
        }
        // if (dropdownObserver) {
        //   dropdownObserver.disconnect()
        // }
        if (searchboxListObserver) {
          searchboxListObserver.disconnect()
        }
        removeListboxKeydownListener();
      },
      onPopoverRender: (popover, { config, state }) => {
        if ((state?.activeIndex ?? 0) < steps.length - 1) {
          const finishButton = document.createElement("button");
          finishButton.innerText = i18n.t("finish");
          finishButton.addEventListener('click', () => {
            driverObj.destroy();
            modalObserver.disconnect(); // Stop observing when tour is finished
            modalCloseObserver.disconnect()
            //dropdownObserver.disconnect()
            searchboxListObserver.disconnect()
          });
          popover.footerButtons.appendChild(finishButton);
        }
      },
    });
    const { modalObserver, modalCloseObserver, dropdownObserver, searchboxListObserver } = initObservers(driverObj);
    driverObj.drive();

    // Add event listener for the escape key
    document.addEventListener('keydown', handleEscapeKey);

    // Add event listener to prevent listbox from closing on Escape
    addListboxKeydownListener();
  };

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (driverObj) {
        driverObj.destroy();
      }
      document.removeEventListener('keydown', handleEscapeKey);
      removeListboxKeydownListener();
    }
  };

  const addListboxKeydownListener = () => {
    listboxKeydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); // Prevent default behavior (closing the listbox)
        if (driverObj) {
          driverObj.destroy();
        }
      }
    };
  
    document.addEventListener('keydown', listboxKeydownListener);
  };

  const removeListboxKeydownListener = () => {
    if (listboxKeydownListener) {
      document.removeEventListener('keydown', listboxKeydownListener);
      listboxKeydownListener = undefined;
    }
  };

  const createButton = createCreateButton(i18n.t('createGuide'));
  createButton.addEventListener('click', async () => {
    try {
      const isLicenseValid = await validateLicenseKey(config.secretKey);

      if (!isLicenseValid) {
        await showConfigDialog(
          i18n.t('errorLabel'),
          i18n.t('invalidOrExpiredLicense'),
          i18n.t('errorLabel'),
          'error'
        );
        return;
      }

      const shouldCreateGuide = await showCreateGuideDialog();
      if (shouldCreateGuide) {
        startGuideCreation();
      }
    } catch (error) {
      console.error('Error validating license:', error);
      await showConfigDialog(
        i18n.t('errorLabel'),
        i18n.t('errorValidatingLicense'),
        i18n.t('errorLabel'),
        'error'
      );
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
          console.error("No parent field element found");
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