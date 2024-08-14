// SideMenu.ts

import { Dropdown, Button } from "kintone-ui-component";
import { ButtonOptions } from "./components/buttonUtils";
import {
  showErrorNotification,
  showSuccessNotification,
  showSpinner,
} from "./components/notificationUtils";
import { saveGuideSteps } from "./GuideSteps";
import { DriveStep } from "driver.js";
import { CustomElementPicker } from "./ElementPicker";
import { SelectedElement } from "./types";
import { t } from "i18next";

export class SideMenu {
  private sideMenu: HTMLElement;
  private selectedElements: SelectedElement[] = [];
  private finishButton: Button;
  private elementPicker: CustomElementPicker;

  constructor(elementPicker: CustomElementPicker) {
    this.elementPicker = elementPicker;
    this.sideMenu = this.createSideMenu();
    this.finishButton = this.createFinishButton();
  }

  private createSideMenu(): HTMLElement {
    const sideMenu = document.createElement("div");
    sideMenu.id = "guide-side-menu";
    sideMenu.innerHTML = `
    <h2>${t("createGuide")}</h2>
    <div id="selected-elements-list" class="scrollable-list"></div>
    <div id="close-button-container"></div>
    <div id="finish-button-container"></div>
  `;
    document.body.appendChild(sideMenu);

    const closeButtonOptions: ButtonOptions = {
      text: t("close"),
      type: "normal",
      className: "sideMenuCloseButton",
    };
    const closeButton = new Button(closeButtonOptions);
    closeButton.addEventListener("click", () => this.close());
    document.getElementById("close-button-container")?.appendChild(closeButton);
    return sideMenu;
  }

  private createFinishButton(): Button {
    const button = new Button({
      text: t("finishGuideCreation"),
      type: "submit",
    });
    button.addEventListener("click", () => this.finishGuideCreation());
    button.disabled = true;
    document.getElementById("finish-button-container")?.appendChild(button);
    return button;
  }

  show() {
    this.sideMenu.classList.add("open");
  }

  close() {
    this.sideMenu.classList.remove("open");
    this.selectedElements = [];
    this.updateSelectedElementsList();
    this.updateFinishButtonState();
    this.elementPicker.close();
  }

  private updateFinishButtonState() {
    if (this.finishButton) {
      this.finishButton.disabled = this.selectedElements.length === 0;
    }
  }
  public addElement(element: HTMLElement) {
    const label = this.getElementLabel(element);
    const fieldClass = this.getFieldClass(element);
    if (fieldClass) {
      this.selectedElements.push({
        fieldClass,
        label,
        title: "",
        description: "",
        position: "right",
      });
      this.updateSelectedElementsList();
      this.updateFinishButtonState();
    } else {
      console.error("SideMenu: No matching field class found for the element");
    }
  }

  private getElementLabel(element: HTMLElement): string {
    const labelElement = element.querySelector(".control-label-text-gaia");
    return labelElement ? labelElement.textContent || "No Label" : "No Label";
  }

  private getFieldClass(element: HTMLElement): string | null {
    // Some fields have 6_ prefix maybe?
    const pattern2 = /^6_-\d{1,9}$/;
    // Most fields are this
    const pattern = /^field-\d{1,9}$/;
    // Tables
    const pattern3 = /^subtable-\d{1,9}$/;
    let result: string | null = null;
    element.classList.forEach((className) => {
      if (pattern.test(className)) {
        result = className;
      } else if (pattern2.test(className)) {
        result = className;
      } else if (pattern3.test(className)) {
        result = className;
      }
    });
    return result;
  }

  private updateSelectedElementsList() {
    const listContainer = document.getElementById("selected-elements-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    this.selectedElements.forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.classList.add("selected-element-item");
      listItem.innerHTML = `
        <div>${index + 1}. ${item.label} (${item.fieldClass})</div>
        <input maxlength="25" type="text" class="title-input" placeholder="${t("enterTitle")}" value="${item.title}" data-index="${index}">
        <textarea maxlength="550"class="description-input" placeholder="${t("enterDescription")}" data-index="${index}">${item.description}</textarea>
        <div id="dropdown-container-${index}" style="margin: 10px 0;"></div>
        <button class="remove-element" data-index="${index}">${t("remove")}</button>
      `;
      listContainer.appendChild(listItem);

      // Create and add the dropdown
      const dropdownContainer = listItem.querySelector(
        `#dropdown-container-${index}`,
      );
      if (dropdownContainer) {
        const positionDropdown = new Dropdown({
          label: t("position"),
          items: [
            { label: t("right"), value: "right" },
            { label: t("left"), value: "left" },
            { label: t("top"), value: "top" },
            { label: t("bottom"), value: "bottom" },
          ],
          value: item.position,
          id: `position-dropdown-${index}`,
        });
        dropdownContainer.appendChild(positionDropdown);

        // Add event listener for dropdown change
        positionDropdown.addEventListener("change", (event: Event) => {
          const customEvent = event as unknown as { detail: { value: string } };
          this.selectedElements[index].position = customEvent.detail.value;
        });
      } else {
        console.error(`Dropdown container not found for index ${index}`);
      }
    });

    // Add event listeners to inputs and remove buttons
    listContainer
      .querySelectorAll(".title-input, .description-input")
      .forEach((input) => {
        input.addEventListener("input", (e) => {
          const index = parseInt(
            (e.target as HTMLElement).getAttribute("data-index") || "0",
            10,
          );
          const field = (e.target as HTMLElement).classList.contains(
            "title-input",
          )
            ? "title"
            : "description";
          this.selectedElements[index][field] = (
            e.target as HTMLInputElement
          ).value;
        });
      });

    const removeButtons =
      listContainer.getElementsByClassName("remove-element");
    Array.from(removeButtons).forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(
          (e.target as HTMLElement).getAttribute("data-index") || "0",
          10,
        );
        this.selectedElements.splice(index, 1);
        this.updateSelectedElementsList();
      });
    });

    this.updateFinishButtonState();
  }

  private async finishGuideCreation() {
    const spinner = showSpinner(t("loading"));
    try {
      const newGuideSteps = this.prepareNewGuideSteps();
      const currentAppId = kintone.app.getId();
      if (currentAppId === null) {
        throw new Error("Unable to get current app ID");
      }
      await saveGuideSteps(newGuideSteps, currentAppId.toString());
      showSuccessNotification(t("guideCreatedSuccessfully"));
    } catch (error) {
      console.error("Error in finishGuideCreation:", error);
      showErrorNotification(t("failedToCreateGuide"));
    } finally {
      (await spinner).close();
      this.elementPicker.close();
      this.close();
    }
  }

  private prepareNewGuideSteps(): DriveStep[] {
    return this.selectedElements.map(
      ({ fieldClass, title, description, position }, index) => ({
        element: `.${fieldClass}`,
        popover: {
          title: title,
          description: description,
          side: position as "top" | "right" | "bottom" | "left",
          align: "end",
        },
      }),
    );
  }
}
