import { driver } from "driver.js";

let driverObj: ReturnType<typeof driver> | null = null;
let originalListboxPosition: string | null = null;

const isModal = (element: Element): boolean => element.classList.contains('ocean-ui-dialog');
const isDropdown = (element: Element): boolean => ['menu', 'listbox'].includes(element.getAttribute('role') || '');
const isSearchboxList = (element: Element): boolean => element.classList.contains('entityselect-searchbox-list-cybozu');

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

function handleChildListMutation(mutation: MutationRecord) {
    const target = mutation.target;
    if (target instanceof Element && isSearchboxList(target)) {
        handleSearchboxListContentChange(target as HTMLElement);
    }

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

function handleSearchboxListAppearance(listElement: Element) {
    if (driverObj && listElement instanceof HTMLElement) {
        originalListboxPosition = listElement.style.position;
        listElement.style.position = 'static';
        driverObj.highlight({ element: listElement });
    }
}

function handleSearchboxListContentChange(listElement: HTMLElement) {
    if (listElement.children.length === 0) {
        returnToOriginalStep();
    } else {
        handleSearchboxListAppearance(listElement);
    }
}

function handleSearchboxListStyleChange(listElement: HTMLElement) {
    if (listElement.style.display === 'none') {
        returnToOriginalStep();
    } else {
        handleSearchboxListAppearance(listElement);
    }
}

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
