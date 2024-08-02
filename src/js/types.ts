export interface ElementPickerOptions {
  style?: {
    borderColor: string;
  };
  highlightedElement?: (el: HTMLElement) => HTMLElement | null;
}

export interface SelectedElement {
  fieldClass: string;
  label: string;
  title: string;
  description: string;
  position: string;
}

export interface DropdownChangeEvent extends Event {
  detail: {
    value: string;
  };
}