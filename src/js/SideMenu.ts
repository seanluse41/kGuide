import { Button } from 'kintone-ui-component/lib/button';
import { SelectedElement } from './types';

export class SideMenu {
    private sideMenu: HTMLElement;
    private selectedElements: SelectedElement[] = [];

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

        const finishButton = new Button({
            text: 'Finish Guide Creation',
            type: 'submit'
        });
        finishButton.addEventListener('click', () => this.finishGuideCreation());
        sideMenu.appendChild(finishButton);

        return sideMenu;
    }

    show() {
        this.sideMenu.classList.add('open');
    }

    close() {
        this.sideMenu.classList.remove('open');
        this.selectedElements = [];
        this.updateSelectedElementsList();
    }

    public addElement(element: HTMLElement) {
        console.log("SideMenu: Adding element", element);
        const label = this.getElementLabel(element);
        const fieldClass = this.getFieldClass(element);
        if (fieldClass) {
          console.log("SideMenu: Field class found", fieldClass);
          this.selectedElements.push({ fieldClass, label, title: '', description: '' });
          this.updateSelectedElementsList();
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
        console.log("SideMenu: Updating list", this.selectedElements);
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
            <button class="remove-element" data-index="${index}">Remove</button>
          `;
          listContainer.appendChild(listItem);
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
      }

    private finishGuideCreation() {
        const newGuideSteps = this.prepareNewGuideSteps();
        console.log('New guide steps:', newGuideSteps);
        // Here you can process the new guide steps as needed
        this.close();
    }

    private prepareNewGuideSteps(): { index: number, fieldClass: string, title: string, description: string }[] {
        return this.selectedElements.map(({ fieldClass, title, description }, index) => ({
            index: index + 1,
            fieldClass,
            title,
            description
        }));
    }
}