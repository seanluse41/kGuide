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

export interface FieldLayout {
  type: string;
  code: string;
  layout?: FieldLayout[];
}

export interface SectionLayout {
  type: string;
  code?: string;
  fields?: FieldLayout[];
}

export interface AppLayout {
  layout: SectionLayout[];
}