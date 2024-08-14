import { driver } from "driver.js";
import { FieldLayout, SectionLayout, AppLayout } from '../types';

let driverObj: ReturnType<typeof driver> | null = null;
let originalListboxPosition: string | null = null;
let escapeKeyListener: ((event: KeyboardEvent) => void) | null = null;
let listboxKeydownListener: ((event: KeyboardEvent) => void) | null = null;
let lastDisplayState: string | null = null;
let originalDropdownParent: HTMLElement | null = null;
let originalDropdownStyle: string = '';
let originalParentWidth: string = '';
let isDropdownMoved: boolean = false;

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
        attributeFilter: ['aria-expanded', 'aria-checked', 'style'],
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
        if (isDropdown(target) && mutation.attributeName === 'style') {
            handleDropdownStyleChange(target as HTMLElement);
        } else if (isSearchboxList(target) && mutation.attributeName === 'style') {
            handleSearchboxListStyleChange(target as HTMLElement);
        } else if (isDropdownOption(target) && mutation.attributeName === 'aria-checked') {
            handleDropdownOptionSelection(target as HTMLElement);
        } else if (isRichTextSizeBox(target) && mutation.attributeName === 'style') {
            handleRichTextSizeBoxStyleChange(target as HTMLElement);
        }
    }
}

//
// Element Type Checks
//

const isModal = (element: Element): boolean => element.classList.contains('ocean-ui-dialog') || element.classList.contains('modal-dialog');
const isDropdown = (element: Element): boolean =>
    element.classList.contains('gaia-argoui-selectmenu') &&
    element.getAttribute('role') === 'menu';
const isSearchboxList = (element: Element): boolean => element.classList.contains('entityselect-searchbox-list-cybozu');
const isDropdownOption = (element: Element): boolean => {
    return element.getAttribute('role') === 'menuitemradio';
}
const isRichTextSizeBox = (element: Element): boolean => element.classList.contains('goog-menu') && element.getAttribute('role') === 'listbox';

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

function handleDropdownStyleChange(dropdownElement: HTMLElement) {
    const currentDisplay = dropdownElement.style.display;

    if (currentDisplay !== lastDisplayState) {
        lastDisplayState = currentDisplay;
        if (currentDisplay !== 'none') {
            // Dropdown is being shown
            const activeElement = document.querySelector('.driver-active-element');
            if (activeElement instanceof HTMLElement) {
                originalDropdownParent = dropdownElement.parentElement;
                originalDropdownStyle = dropdownElement.style.cssText;
                originalParentWidth = activeElement.style.width;

                // Move dropdown to be a child of the active element
                activeElement.appendChild(dropdownElement);
                dropdownElement.style.position = 'static';
                dropdownElement.style.left = 'auto';
                dropdownElement.style.top = 'auto';

                // Set parent width to auto
                activeElement.style.width = 'auto';

                isDropdownMoved = true;

                // Add click event listener to the dropdown element itself
                dropdownElement.addEventListener('click', handleDropdownClick);

                // Re-highlight the current step
                if (driverObj) {
                    driverObj.refresh();
                }
            }
        } else {
            // Dropdown is being hidden
            revertDropdownChanges(dropdownElement);
        }
    }
}

function handleDropdownClick(event: MouseEvent) {
    const dropdownElement = event.currentTarget as HTMLElement;
    const isClickInsideOptions = (event.target as HTMLElement).closest('[role="menuitemradio"]');

    if (!isClickInsideOptions) {
        // Click is on the dropdown field itself, not on an option
        revertDropdownChanges(dropdownElement);
    }
}

function handleDropdownOptionSelection(optionElement: HTMLElement) {
    if (isDropdownMoved) {
        const dropdownElement = optionElement.closest('.gaia-argoui-selectmenu');
        if (dropdownElement) {
            revertDropdownChanges(dropdownElement as HTMLElement);
        }
    }
}

function revertDropdownChanges(dropdownElement: HTMLElement) {
    if (originalDropdownParent) {
        // Remove click event listener from the dropdown element
        dropdownElement.removeEventListener('click', handleDropdownClick);

        // Revert DOM changes
        originalDropdownParent.appendChild(dropdownElement);
        dropdownElement.style.cssText = originalDropdownStyle;
        dropdownElement.style.display = "none";

        // Restore original parent width
        const activeElement = document.querySelector('.driver-active-element');
        if (activeElement instanceof HTMLElement) {
            activeElement.style.width = originalParentWidth;
        }

        // Reset variables
        originalDropdownParent = null;
        originalDropdownStyle = '';
        originalParentWidth = '';
        isDropdownMoved = false;

        // Re-highlight the current step
        if (driverObj) {
            driverObj.refresh();
        }
    }
}

let isRichTextSizeBoxOpen = false;
let richTextSizeBoxElement: HTMLElement | null = null;

function handleRichTextSizeBoxStyleChange(listElement: HTMLElement) {
    const currentDisplay = listElement.style.display;

    if (currentDisplay !== 'none' && !isRichTextSizeBoxOpen) {
        console.log("Rich text size box opened");
        isRichTextSizeBoxOpen = true;
        richTextSizeBoxElement = listElement;
        listElement.addEventListener('click', handleRichTextSizeBoxClick);
        
        if (driverObj) {          
            driverObj.highlight({
                element: listElement,
            });
        }
    } else if (currentDisplay === 'none' && isRichTextSizeBoxOpen) {
        console.log("Rich text size box closed");
        closeRichTextSizeBox();
    }
}

function handleRichTextSizeBoxClick(event: MouseEvent) {
    const clickedOption = (event.target as HTMLElement).closest('[role="menuitem"]');

    if (clickedOption) {
        console.log("Option selected in rich text size box");
        closeRichTextSizeBox();
    }
}

function closeRichTextSizeBox() {
    isRichTextSizeBoxOpen = false;
    if (richTextSizeBoxElement) {
        richTextSizeBoxElement.removeEventListener('click', handleRichTextSizeBoxClick);
        richTextSizeBoxElement = null;
    }
    returnToOriginalStep();
}

// Add this function to reset the rich text size box state when the tour ends
export function resetRichTextSizeBoxState() {
    isRichTextSizeBoxOpen = false;
    richTextSizeBoxElement = null;
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
            if (isRichTextSizeBoxOpen) {
                closeRichTextSizeBox();
            } else {
                callback();
                removeEscapeKeyListener();
            }
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