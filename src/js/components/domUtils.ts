import { driver } from "driver.js";
import { FieldLayout, SectionLayout, AppLayout } from '../types';

let driverObj: ReturnType<typeof driver> | null = null;
let originalListboxPosition: string | null = null;
let escapeKeyListener: ((event: KeyboardEvent) => void) | null = null;
let listboxKeydownListener: ((event: KeyboardEvent) => void) | null = null;

//
// Driver.js Initialization and Observers
//

export function initObservers(driverInstance: ReturnType<typeof driver>) {
    driverObj = driverInstance;
    const observer = createMutationObserver();
    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['aria-expanded', 'style'],
        characterData: true
    });
    return observer;
}

function createMutationObserver(): MutationObserver {
    return new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                handleChildListMutation(mutation);
            } else if (mutation.type === 'attributes') {
                handleAttributeMutation(mutation);
            }
        });
    });
}

//
// Mutation Handlers
//

function handleChildListMutation(mutation: MutationRecord) {
    mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
            if (isModal(node)) {
                handleModalAppearance(node);
            } else if (isSearchboxList(node)) {
                handleSearchboxListAppearance(node);
            }
        }
    });

    mutation.removedNodes.forEach((node) => {
        if (node instanceof Element) {
            if (isModal(node)) {
                handleModalDisappearance();
            } else if (isSearchboxList(node)) {
                handleSearchboxListDisappearance();
            }
        }
    });
}

function handleAttributeMutation(mutation: MutationRecord) {
    const target = mutation.target;
    if (target instanceof Element) {
        if (isDropdown(target) && mutation.attributeName === 'aria-expanded') {
            handleDropdownChange(target);
        } else if (isSearchboxList(target) && mutation.attributeName === 'style') {
            handleSearchboxListStyleChange(target as HTMLElement);
        }
    }
}

//
// Element Type Checks
//

const isModal = (element: Element): boolean => element.classList.contains('ocean-ui-dialog');
const isDropdown = (element: Element): boolean => ['menu', 'listbox'].includes(element.getAttribute('role') || '');
const isSearchboxList = (element: Element): boolean => element.classList.contains('entityselect-searchbox-list-cybozu');

//
// Element Handlers
//

function handleSearchboxListAppearance(listElement: Element) {
    if (driverObj && listElement instanceof HTMLElement) {
        originalListboxPosition = listElement.style.position;
        listElement.style.position = 'static';
        // return to original step re-highlights the searchbox AND its listbox because the box is static now.
        // if only there was a way to do this without setting to static...
        returnToOriginalStep()
    }
}

function handleSearchboxListStyleChange(listElement: HTMLElement) {
    if (listElement.style.display === 'none') {
        returnToOriginalStep();
    } else {
        handleSearchboxListAppearance(listElement);
    }
}

function handleSearchboxListDisappearance() {
    returnToOriginalStep();
}

function handleModalAppearance(modalElement: Element) {
    if (driverObj) {
        driverObj.highlight({ element: modalElement });
    }
}

function handleModalDisappearance() {
    returnToOriginalStep();
}

function handleDropdownChange(dropdownElement: Element) {
    console.log("Dropdown state changed:", dropdownElement);
    // Add your dropdown handling logic here if needed
}

//
// Tour Navigation
//

function returnToOriginalStep() {
    if (driverObj) {
        const currentHighlightedElement = document.querySelector('.driver-highlighted-element');
        if (currentHighlightedElement instanceof HTMLElement && isSearchboxList(currentHighlightedElement)) {
            currentHighlightedElement.style.position = originalListboxPosition || '';
        }
        const currentStep = driverObj.getActiveIndex();
        if (currentStep !== null && currentStep !== undefined) {
            driverObj.moveTo(currentStep);
        } else {
            driverObj.drive();
        }
        originalListboxPosition = null;
    } else {
        console.error("driverObj is null, cannot return to original step");
    }
}

//
// Field Group Management
//

export async function openAllFieldGroups() {
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

//
// Escape Key EventListeners
//

export function addEscapeKeyListener(callback: () => void) {
    escapeKeyListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            callback();
            removeEscapeKeyListener();
        }
    };
    document.addEventListener('keydown', escapeKeyListener);
}

export function removeEscapeKeyListener() {
    if (escapeKeyListener) {
        document.removeEventListener('keydown', escapeKeyListener);
        escapeKeyListener = null;
    }
}

//
// Listbox KeyDown EventListeners
//

export function addListboxKeydownListener(callback: () => void) {
    listboxKeydownListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            callback();
        }
    };
    document.addEventListener('keydown', listboxKeydownListener);
}

export function removeListboxKeydownListener() {
    if (listboxKeydownListener) {
        document.removeEventListener('keydown', listboxKeydownListener);
        listboxKeydownListener = null;
    }
}