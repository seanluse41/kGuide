// domUtils.ts

import { driver } from "driver.js";

let driverObj: ReturnType<typeof driver> | null = null;
let activeStepBeforeModal: number | null = null;

const isModal = (element: Element): boolean => {
    return element.classList.contains('ocean-ui-dialog');
}

export function initObservers(driverInstance: ReturnType<typeof driver>) {
    driverObj = driverInstance;
    const modalObserver = createModalObserver();
    const modalCloseObserver = createModalCloseObserver();

    modalObserver.observe(document.body, { childList: true, subtree: true });
    modalCloseObserver.observe(document.body, { childList: true, subtree: true });

    return { modalObserver, modalCloseObserver };
}

function createModalObserver(): MutationObserver {
    return new MutationObserver(async (mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof Element && isModal(node)) {
                        if (driverObj) {
                            // Store the current active step
                            const currentStep = driverObj.getActiveIndex();
                            activeStepBeforeModal = currentStep !== undefined ? currentStep : null;

                            const modalHighlight = {
                                element: node,
                                // popover: {
                                //   title: i18n.t('modalTitle', 'Modal Detected'),
                                //   description: i18n.t('modalDescription', 'A modal has appeared during the tour.'),
                                //   position: 'bottom'
                                // }
                            };

                            driverObj.highlight(modalHighlight);
                        }
                    }
                });
            }
        });
    });
}

function createModalCloseObserver(): MutationObserver {
    return new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.removedNodes.forEach((node) => {
                    if (node instanceof Element && isModal(node)) {
                        console.log('Modal closed:', node);
                        if (driverObj && activeStepBeforeModal !== null) {
                            console.log(`Returning to step ${activeStepBeforeModal}`);
                            driverObj.moveTo(activeStepBeforeModal);
                            activeStepBeforeModal = null; // Reset the stored step
                        } else {
                            console.log("Unable to return to previous step, restarting tour");
                            driverObj?.drive();
                        }
                    }
                });
            }
        });
    });
}