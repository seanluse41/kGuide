// domUtils.ts

import { driver } from "driver.js";

let driverObj: ReturnType<typeof driver> | null = null;
let activeStepBeforeModal: number | null = null;
let activeStepBeforeDropdown: number | null = null;
let activeStepBeforeSearchbox: number | null = null;

const isModal = (element: Element): boolean => {
    return element.classList.contains('ocean-ui-dialog');
}

const isDropdown = (element: Element): boolean => {
    const role = element.getAttribute('role');
    return role === 'menu' || role === 'listbox';
}

export function initObservers(driverInstance: ReturnType<typeof driver>) {
    driverObj = driverInstance;
    const modalObserver = createModalObserver();
    const modalCloseObserver = createModalCloseObserver();
    const dropdownObserver = createDropdownObserver();
    const searchboxListObserver = createSearchboxListObserver();

    modalObserver.observe(document.body, { childList: true, subtree: true });
    modalCloseObserver.observe(document.body, { childList: true, subtree: true });
    dropdownObserver.observe(document.body, { attributes: true, subtree: true });

    const searchboxList = document.querySelector('.entityselect-searchbox-list-cybozu');
    if (searchboxList) {
        searchboxListObserver.observe(searchboxList, { childList: true, attributes: true, attributeFilter: ['style'] });
    }

    return { modalObserver, modalCloseObserver, dropdownObserver, searchboxListObserver };
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
                            driverObj.moveTo(activeStepBeforeModal);
                            activeStepBeforeModal = null; // Reset the stored step
                        } else {
                            driverObj?.drive();
                        }
                    }
                });
            }
        });
    });
}

function createDropdownObserver(): MutationObserver {
    return new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
                const target = mutation.target;
                if (target instanceof Element && isDropdown(target)) {
                    console.log("its a dropdown.")
                }
            }
        });
    });
}

function highlightSearchboxList(listElement: Element) {
    if (driverObj) {
        const currentStep = driverObj.getActiveIndex();
        activeStepBeforeSearchbox = currentStep !== undefined ? currentStep : null;
        
        driverObj.highlight({
            element: listElement,
            // popover: {
            //     title: 'Searchbox List Opened',
            //     description: 'A searchbox list has been opened.',
            //     side: 'bottom'
            // }
        });
    }
}

function returnToOriginalStep() {
    console.log("returning to step", activeStepBeforeSearchbox)
    if (driverObj && activeStepBeforeSearchbox !== null) {
        driverObj.moveTo(activeStepBeforeSearchbox);
        activeStepBeforeSearchbox = null;
    }
}

function createSearchboxListObserver(): MutationObserver {
    return new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const target = mutation.target as HTMLElement;
                if (target.classList.contains('entityselect-searchbox-list-cybozu')) {
                    console.log(target.children.length)
                    console.log(target.style)
                    if (target.children.length === 0 || target.style.display === 'none') {
                        highlightSearchboxList(target);
                    } else {
                        returnToOriginalStep();
                    }
                }
            }
        });
    });
}