// src/components/buttonUtils.ts

import { Button } from 'kintone-ui-component';

export interface ButtonOptions {
  text: string;
  type?: 'normal' | 'submit' | 'alert';
  className?: string;
}

export const createButton = (options: ButtonOptions): Button => {
  return new Button(options);
};

export const createGuideButton = (text: string): Button => {
  return createButton({
    text: text,
    type: 'submit'
  });
};

export const createCreateButton = (text: string): Button => {
  return createButton({
    text: text,
    type: 'submit',
    className: 'guide-button2'
  });
};