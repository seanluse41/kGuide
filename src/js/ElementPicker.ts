import { ElementPickerOptions } from "./types";
import { ElementPicker } from "pick-dom-element";

export class CustomElementPicker {
  private picker: any; // Replace 'any' with the actual type from the ElementPicker library
  private currentHighlightedElement: HTMLElement | null = null;
  constructor(options: ElementPickerOptions) {
    this.picker = new ElementPicker(options);
  }

  highlightElement(el: HTMLElement | null) {
    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.style.outline = "";
    }
    if (el) {
      el.style.outline = `2px solid #3498db`;
      this.currentHighlightedElement = el;
    } else {
      this.currentHighlightedElement = null;
    }
  }

  getParentFieldElement(el: HTMLElement): HTMLElement | null {
    // Some fields have 6_ prefix maybe?
    const pattern2 = /^6_-\d{1,9}$/;
    // Most fields are this
    const pattern = /^field-\d{1,9}$/;
    // Tables
    const pattern3 = /^subtable-\d{1,9}$/;
    let currentElement: HTMLElement | null = el;

    while (currentElement) {
      if (
        Array.from(currentElement.classList).some((className) =>
          pattern.test(className),
        )
      ) {
        return currentElement;
      } else if (
        Array.from(currentElement.classList).some((className) =>
          pattern2.test(className),
        )
      ) {
        return currentElement;
      } else if (
        Array.from(currentElement.classList).some((className) =>
          pattern3.test(className),
        )
      ) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }

    return null;
  }

  close() {
    this.picker.stop();
    // Remove highlight from the currently highlighted element
    this.highlightElement(null);
  }

  start(options: any) {
    this.picker.start(options);
  }
}
