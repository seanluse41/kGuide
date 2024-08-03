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

export const createGuideButton = (): Button => {
  return createButton({
    text: 'Start Guide',
    type: 'submit'
  });
};

export const createCreateButton = (): Button => {
  return createButton({
    text: 'Create Guide',
    type: 'submit',
    className: 'guide-button2'
  });
};