import { SelectedElement } from './types';
import { Spinner, Button, Dropdown } from 'kintone-ui-component';
import { saveGuideSteps } from './GuideSteps';
import { DriveStep } from "driver.js";

let spinner = new Spinner({
  text: 'ガイド更新中…',
  container: document.body
});

export class SideMenu {
  private sideMenu: HTMLElement;
  private selectedElements: SelectedElement[] = [];
  private finishButton!: Button;

  constructor() {
    this.sideMenu = this.createSideMenu();
  }

  private createSideMenu(): HTMLElement {
    const sideMenu = document.createElement('div');
    sideMenu.id = 'guide-side-menu';
    sideMenu.innerHTML = `
      <h2>Create Guide</h2>
      <div id="selected-elements-list" class="scrollable-list"></div>
    `;
    document.body.appendChild(sideMenu);

    const closeButton = new Button({
      text: 'Close',
      type: 'normal'
    });
    closeButton.addEventListener('click', () => this.close());
    sideMenu.appendChild(closeButton);

    this.finishButton = new Button({
      text: 'Finish Guide Creation',
      type: 'submit',
      disabled: true
    });
    this.finishButton.addEventListener('click', () => this.finishGuideCreation());
    sideMenu.appendChild(this.finishButton);

    return sideMenu;
  }

  show() {
    this.sideMenu.classList.add('open');
  }

  close() {
    this.sideMenu.classList.remove('open');
    this.selectedElements = [];
    this.updateSelectedElementsList();
    this.updateFinishButtonState();
  }

  public addElement(element: HTMLElement) {
    const label = this.getElementLabel(element);
    const fieldClass = this.getFieldClass(element);
    if (fieldClass) {
      this.selectedElements.push({ fieldClass, label, title: '', description: '', position: 'right' });
      this.updateSelectedElementsList();
      this.updateFinishButtonState();
    } else {
      console.error("SideMenu: No matching field class found for the element");
    }
  }

  private getElementLabel(element: HTMLElement): string {
    const labelElement = element.querySelector('.control-label-text-gaia');
    return labelElement ? labelElement.textContent || 'No Label' : 'No Label';
  }

  private getFieldClass(element: HTMLElement): string | null {
    const pattern = /^field-\d{5,9}$/;
    let result: string | null = null;
    element.classList.forEach((className) => {
      if (pattern.test(className)) {
        result = className;
      }
    });
    return result;
  }

  private updateSelectedElementsList() {
    const listContainer = document.getElementById('selected-elements-list');
    if (!listContainer) return;
  
    listContainer.innerHTML = '';
    this.selectedElements.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.classList.add('selected-element-item');
      listItem.innerHTML = `
        <div>${index + 1}. ${item.label} (${item.fieldClass})</div>
        <input type="text" class="title-input" placeholder="Enter title" value="${item.title}" data-index="${index}">
        <textarea class="description-input" placeholder="Enter description" data-index="${index}">${item.description}</textarea>
        <div id="dropdown-container-${index}" style="margin: 10px 0;"></div>
        <button class="remove-element" data-index="${index}">Remove</button>
      `;
      listContainer.appendChild(listItem);
  
      // Create and add the dropdown
      const dropdownContainer = listItem.querySelector(`#dropdown-container-${index}`);
      if (dropdownContainer) {
        const positionDropdown = new Dropdown({
          label: 'Position',
          items: [
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
          ],
          value: item.position,
          id: `position-dropdown-${index}`,
        });
        dropdownContainer.appendChild(positionDropdown);
  
        // Add event listener for dropdown change
        positionDropdown.addEventListener('change', (event: Event) => {
          const customEvent = event as unknown as { detail: { value: string } };
          this.selectedElements[index].position = customEvent.detail.value;
        });
      } else {
        console.error(`Dropdown container not found for index ${index}`);
      }
    });

    // Add event listeners to inputs and remove buttons
    listContainer.querySelectorAll('.title-input, .description-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        const field = (e.target as HTMLElement).classList.contains('title-input') ? 'title' : 'description';
        this.selectedElements[index][field] = (e.target as HTMLInputElement).value;
      });
    });

    const removeButtons = listContainer.getElementsByClassName('remove-element');
    Array.from(removeButtons).forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.selectedElements.splice(index, 1);
        this.updateSelectedElementsList();
      });
    });

    this.updateFinishButtonState();
  }

  private updateFinishButtonState() {
    if (this.finishButton) {
      this.finishButton.disabled = this.selectedElements.length === 0;
    }
  }

  private async finishGuideCreation() {
    try {
      spinner.open();
      const newGuideSteps = this.prepareNewGuideSteps();    
      const currentAppId = kintone.app.getId();
      if (currentAppId === null) {
        throw new Error('Unable to get current app ID');
      }
      
      await saveGuideSteps(newGuideSteps, currentAppId.toString());
      console.log('Guide steps saved successfully');
      // You might want to show a success message to the user here
    } catch (error) {
      console.error('Error in finishGuideCreation:', error);
      // You might want to show an error message to the user here
    } finally {
      spinner.close();
      this.close();
    }
  }

  private prepareNewGuideSteps(): DriveStep[] {
    return this.selectedElements.map(({ fieldClass, title, description, position }, index) => ({
      element: `.${fieldClass}`,
      popover: {
        title: title,
        description: description,
        side: position as 'top' | 'right' | 'bottom' | 'left',
        align: "end"
      }
    }));
  }
}