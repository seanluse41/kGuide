import { driver } from "driver.js";
import { FieldLayout, SectionLayout, AppLayout } from "../types";

let driverObj: ReturnType<typeof driver> | null = null;
let escapeKeyListener: ((event: KeyboardEvent) => void) | null = null;
let listboxKeydownListener: ((event: KeyboardEvent) => void) | null = null;

//
// Dropdown-related variables and functions
//
let lastDisplayState: string | null = null;
let originalDropdownParent: HTMLElement | null = null;
let originalDropdownStyle: string = "";
let originalParentWidth: string = "";
let isDropdownMoved: boolean = false;

function handleDropdownStyleChange(dropdownElement: HTMLElement) {
  const currentDisplay = dropdownElement.style.display;

  if (currentDisplay !== lastDisplayState) {
    lastDisplayState = currentDisplay;
    if (currentDisplay !== "none") {
      // Dropdown is being shown
      const activeElement = document.querySelector(".driver-active-element");
      if (activeElement instanceof HTMLElement) {
        originalDropdownParent = dropdownElement.parentElement;
        originalDropdownStyle = dropdownElement.style.cssText;
        originalParentWidth = activeElement.style.width;

        // Move dropdown to be a child of the active element
        activeElement.appendChild(dropdownElement);
        dropdownElement.style.position = "static";
        dropdownElement.style.left = "auto";
        dropdownElement.style.top = "auto";

        // Set parent width to auto
        activeElement.style.width = "auto";

        isDropdownMoved = true;

        // Add click event listener to the dropdown element itself
        dropdownElement.addEventListener("click", handleDropdownClick);

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
  const isClickInsideOptions = (event.target as HTMLElement).closest(
    '[role="menuitemradio"]',
  );

  if (!isClickInsideOptions) {
    // Click is on the dropdown field itself, not on an option
    revertDropdownChanges(dropdownElement);
  }
}

function handleDropdownOptionSelection(optionElement: HTMLElement) {
  if (isDropdownMoved) {
    const dropdownElement = optionElement.closest(".gaia-argoui-selectmenu");
    if (dropdownElement) {
      revertDropdownChanges(dropdownElement as HTMLElement);
    }
  }
}

function revertDropdownChanges(dropdownElement: HTMLElement) {
  if (originalDropdownParent) {
    // Remove click event listener from the dropdown element
    dropdownElement.removeEventListener("click", handleDropdownClick);

    // Revert DOM changes
    originalDropdownParent.appendChild(dropdownElement);
    dropdownElement.style.cssText = originalDropdownStyle;
    dropdownElement.style.display = "none";

    // Restore original parent width
    const activeElement = document.querySelector(".driver-active-element");
    if (activeElement instanceof HTMLElement) {
      activeElement.style.width = originalParentWidth;
    }

    // Reset variables
    originalDropdownParent = null;
    originalDropdownStyle = "";
    originalParentWidth = "";
    isDropdownMoved = false;

    // Re-highlight the current step
    if (driverObj) {
      driverObj.refresh();
    }
  }
}

//
// Searchbox-related variables and functions
//
let originalListboxPosition: string | null = null;

function handleSearchboxListAppearance(listElement: Element) {
  if (driverObj && listElement instanceof HTMLElement) {
    originalListboxPosition = listElement.style.position;
    listElement.style.position = "static";
    returnToOriginalStep();
  }
}

function handleSearchboxListStyleChange(listElement: HTMLElement) {
  if (listElement.style.display === "none") {
    returnToOriginalStep();
  } else {
    handleSearchboxListAppearance(listElement);
  }
}

function handleSearchboxListDisappearance() {
  returnToOriginalStep();
}

//
// Modal-related functions
//
function handleModalAppearance(modalElement: Element) {
  if (driverObj) {
    driverObj.highlight({ element: modalElement });
  }
}

function handleModalDisappearance() {
  returnToOriginalStep();
}

//
// Rich Text Size Box-related variables and functions
//
let isRichTextSizeBoxOpen = false;
let richTextSizeBoxElement: HTMLElement | null = null;

function handleRichTextSizeBoxStyleChange(listElement: HTMLElement) {
  const currentDisplay = listElement.style.display;

  if (currentDisplay !== "none" && !isRichTextSizeBoxOpen) {
    isRichTextSizeBoxOpen = true;
    richTextSizeBoxElement = listElement;
    listElement.addEventListener("click", handleRichTextSizeBoxClick);

    if (driverObj) {
      driverObj.highlight({
        element: listElement,
      });
    }
  } else if (currentDisplay === "none" && isRichTextSizeBoxOpen) {
    closeRichTextSizeBox();
  }
}

function handleRichTextSizeBoxClick(event: MouseEvent) {
  const clickedOption = (event.target as HTMLElement).closest(
    '[role="menuitem"]',
  );

  if (clickedOption) {
    closeRichTextSizeBox();
  }
}

function closeRichTextSizeBox() {
  isRichTextSizeBoxOpen = false;
  if (richTextSizeBoxElement) {
    richTextSizeBoxElement.removeEventListener(
      "click",
      handleRichTextSizeBoxClick,
    );
    richTextSizeBoxElement = null;
  }
  returnToOriginalStep();
}

//
// Lookup Clear Popup-related functions
//
function handleLookupClearPopupAppearance(popupElement: Element) {
  if (driverObj && popupElement instanceof HTMLElement) {
    driverObj.highlight({
      element: popupElement,
    });
  }
}

function handleLookupClearPopupDisappearance() {
  returnToOriginalStep();
}

//
// Date Picker-related variables and functions
//
let isDatePickerOpen = false;
let isYearPickerOpen = false;
let isMonthPickerOpen = false;
let datePickerElement: HTMLElement | null = null;
let yearPickerElement: HTMLElement | null = null;
let monthPickerElement: HTMLElement | null = null;

function handleDatePickerStyleChange(element: HTMLElement) {
  const currentDisplay = element.style.display;

  if (currentDisplay !== "none" && !isDatePickerOpen) {
    isDatePickerOpen = true;
    datePickerElement = element;
    highlightElement(datePickerElement);
  } else if (currentDisplay === "none" && isDatePickerOpen) {
    closeDatePicker();
  }
}

function handleYearPickerStyleChange(element: HTMLElement) {
  const currentDisplay = element.style.display;

  if (currentDisplay !== "none" && !isYearPickerOpen) {
    isYearPickerOpen = true;
    yearPickerElement = element;
    highlightElement(yearPickerElement);

    // Add mutation observer for aria-checked changes
    const yearObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-checked"
        ) {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute("aria-checked") === "true") {
            closeYearPicker();
          }
        }
      });
    });
    yearObserver.observe(element, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-checked"],
    });
  } else if (currentDisplay === "none" && isYearPickerOpen) {
    closeYearPicker();
  }
}

function handleMonthPickerStyleChange(element: HTMLElement) {
  const currentDisplay = element.style.display;

  if (currentDisplay !== "none" && !isMonthPickerOpen) {
    isMonthPickerOpen = true;
    monthPickerElement = element;
    highlightElement(monthPickerElement);

    // Add mutation observer for aria-checked changes
    const monthObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-checked"
        ) {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute("aria-checked") === "true") {
            closeMonthPicker();
          }
        }
      });
    });

    monthObserver.observe(element, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-checked"],
    });
  } else if (currentDisplay === "none" && isMonthPickerOpen) {
    closeMonthPicker();
  }
}

function closeDatePicker() {
  isDatePickerOpen = false;
  isYearPickerOpen = false;
  yearPickerElement = null;
  isMonthPickerOpen = false;
  monthPickerElement = null;
  returnToOriginalStep();
}

function closeYearPicker() {
  if (yearPickerElement) {
    isYearPickerOpen = false;
    yearPickerElement = null;
    if (datePickerElement) {
      highlightElement(datePickerElement);
    } else {
      returnToOriginalStep();
    }
  } else {
    console.error("Year picker element not found when trying to close");
  }
}

function closeMonthPicker() {
  if (monthPickerElement) {
    isMonthPickerOpen = false;
    monthPickerElement = null;
    if (datePickerElement) {
      highlightElement(datePickerElement);
    } else {
      returnToOriginalStep();
    }
  } else {
    console.error("Month picker element not found when trying to close");
  }
}

function highlightElement(element: HTMLElement) {
  if (driverObj) {
    driverObj.highlight({
      element: element,
    });
  }
}

//
// Element Type Checks
//
const isModal = (element: Element): boolean =>
  element.classList.contains("ocean-ui-dialog") ||
  element.classList.contains("modal-dialog");
const isDropdown = (element: Element): boolean =>
  element.classList.contains("gaia-argoui-selectmenu") &&
  element.getAttribute("role") === "menu";
const isSearchboxList = (element: Element): boolean =>
  element.classList.contains("entityselect-searchbox-list-cybozu");
const isDropdownOption = (element: Element): boolean => {
  return element.getAttribute("role") === "menuitemradio";
};
const isRichTextSizeBox = (element: Element): boolean =>
  element.classList.contains("goog-menu");
const isLookupClearPopup = (element: Element): boolean =>
  element.classList.contains("removelink-popup-cybozu");

const isDatePicker = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.classList.contains("goog-popupdatepicker");

const isYearPicker = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.classList.contains("gaia-argoui-forms-datepicker-selectmenu") &&
  element.parentElement !== null &&
  element.parentElement.classList.contains("goog-date-picker-year-container");

const isMonthPicker = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.classList.contains("gaia-argoui-forms-datepicker-selectmenu") &&
  element.parentElement !== null &&
  element.parentElement.classList.contains("goog-date-picker-month-container");

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
    attributeFilter: ["aria-expanded", "aria-checked", "style"],
    characterData: true,
  });
  return observer;
}

function createMutationObserver(): MutationObserver {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        handleChildListMutation(mutation);
      } else if (mutation.type === "attributes") {
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
      } else if (isLookupClearPopup(node)) {
        handleLookupClearPopupAppearance(node);
      }
    }
  });

  mutation.removedNodes.forEach((node) => {
    if (node instanceof Element) {
      if (isModal(node)) {
        handleModalDisappearance();
      } else if (isSearchboxList(node)) {
        handleSearchboxListDisappearance();
      } else if (isLookupClearPopup(node)) {
        handleLookupClearPopupDisappearance();
      }
    }
  });
}

function handleAttributeMutation(mutation: MutationRecord) {
  const target = mutation.target;
  if (target instanceof HTMLElement) {
    if (isDropdown(target) && mutation.attributeName === "style") {
      handleDropdownStyleChange(target);
    } else if (isSearchboxList(target) && mutation.attributeName === "style") {
      handleSearchboxListStyleChange(target);
    } else if (
      isDropdownOption(target) &&
      mutation.attributeName === "aria-checked"
    ) {
      handleDropdownOptionSelection(target);
    } else if (
      isRichTextSizeBox(target) &&
      mutation.attributeName === "style"
    ) {
      handleRichTextSizeBoxStyleChange(target);
    } else if (isDatePicker(target) && mutation.attributeName === "style") {
      handleDatePickerStyleChange(target);
    } else if (isYearPicker(target) && mutation.attributeName === "style") {
      handleYearPickerStyleChange(target);
    } else if (isMonthPicker(target) && mutation.attributeName === "style") {
      handleMonthPickerStyleChange(target);
    }
  }
}

//
// Tour Navigation
//
function returnToOriginalStep() {
  if (driverObj) {
    const currentHighlightedElement = document.querySelector(
      ".driver-highlighted-element",
    );
    if (currentHighlightedElement instanceof HTMLElement) {
      if (isSearchboxList(currentHighlightedElement)) {
        currentHighlightedElement.style.position =
          originalListboxPosition || "";
      } else if (isDatePicker(currentHighlightedElement)) {
        closeDatePicker();
      }
    }
    const currentStep = driverObj.getActiveIndex();
    if (currentStep !== null && currentStep !== undefined) {
      driverObj.moveTo(currentStep);
    } else {
      driverObj.drive();
    }
    originalListboxPosition = null;
  }
}

//
// Field Group Management
//
export async function openAllFieldGroups() {
  try {
    const layout: AppLayout = await kintone.api(
      kintone.api.url("/k/v1/app/form/layout", true),
      "GET",
      { app: kintone.app.getId() },
    );
    const openGroups = (fields: FieldLayout[]) => {
      fields.forEach((field) => {
        if (field.type === "GROUP") {
          kintone.app.record.setGroupFieldOpen(field.code, true);
          if (field.layout) {
            openGroups(field.layout);
          }
        }
      });
    };
    layout.layout.forEach((section: SectionLayout) => {
      if (section.type === "GROUP" && section.code) {
        kintone.app.record.setGroupFieldOpen(section.code, true);
      }
      if (section.fields) {
        openGroups(section.fields);
      }
    });
  } catch (error) {
    console.error("Error opening field groups:", error);
  }
}

//
// Escape Key EventListeners
//
export function addEscapeKeyListener(callback: () => void) {
  escapeKeyListener = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (isRichTextSizeBoxOpen) {
        closeRichTextSizeBox();
      } else if (isDatePickerOpen) {
        closeDatePicker();
      } else {
        callback();
        removeEscapeKeyListener();
      }
    }
  };
  document.addEventListener("keydown", escapeKeyListener);
}

export function removeEscapeKeyListener() {
  if (escapeKeyListener) {
    document.removeEventListener("keydown", escapeKeyListener);
    escapeKeyListener = null;
  }
}

//
// Listbox KeyDown EventListeners
//
export function addListboxKeydownListener(callback: () => void) {
  listboxKeydownListener = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      callback();
    }
  };
  document.addEventListener("keydown", listboxKeydownListener);
}

export function removeListboxKeydownListener() {
  if (listboxKeydownListener) {
    document.removeEventListener("keydown", listboxKeydownListener);
    listboxKeydownListener = null;
  }
}

//
// State Reset Functions
//
export function resetRichTextSizeBoxState() {
  isRichTextSizeBoxOpen = false;
  richTextSizeBoxElement = null;
}

export function resetDatePickerState() {
  isDatePickerOpen = false;
  isYearPickerOpen = false;
  isMonthPickerOpen = false;
  yearPickerElement = null;
  monthPickerElement = null;
}
