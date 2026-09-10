const isDropdown = (element) =>
  element.classList.contains('gaia-argoui-selectmenu') && element.getAttribute('role') === 'menu';

const isDropdownOption = (element) => element.getAttribute('role') === 'menuitemradio';

/**
 * Kintone renders an open dropdown menu as an absolutely positioned sibling far
 * away in the DOM, so the tour overlay swallows it. While the menu is open it is
 * re-parented into the highlighted field and laid out in flow, which brings it
 * inside the spotlight; everything is put back the moment it closes.
 */
export const createDropdownHandler = ({ refresh, returnToStep }) => {
  let moved = null; // { element, parent, cssText, activeElementWidth }
  let lastDisplay = null;

  const onDropdownClick = (event) => {
    // A click on the field itself (rather than on an option) closes the menu
    if (!event.target.closest('[role="menuitemradio"]')) {
      revert();
    }
  };

  const move = (element) => {
    const activeElement = document.querySelector('.driver-active-element');
    if (!(activeElement instanceof HTMLElement)) return;

    moved = {
      element,
      parent: element.parentElement,
      cssText: element.style.cssText,
      activeElementWidth: activeElement.style.width,
    };

    activeElement.appendChild(element);
    element.style.position = 'static';
    element.style.left = 'auto';
    element.style.top = 'auto';
    activeElement.style.width = 'auto';

    element.addEventListener('click', onDropdownClick);
    refresh();
  };

  const revert = () => {
    if (!moved) return;

    const { element, parent, cssText, activeElementWidth } = moved;
    moved = null;

    element.removeEventListener('click', onDropdownClick);
    parent?.appendChild(element);
    element.style.cssText = cssText;
    element.style.display = 'none';

    const activeElement = document.querySelector('.driver-active-element');
    if (activeElement instanceof HTMLElement) {
      activeElement.style.width = activeElementWidth;
    }

    lastDisplay = 'none';
    refresh();
  };

  return {
    attributeChanged(target, attributeName) {
      if (attributeName === 'style' && isDropdown(target)) {
        const display = target.style.display;
        if (display === lastDisplay) return;
        lastDisplay = display;

        if (display === 'none') {
          revert();
        } else {
          move(target);
        }
        return;
      }

      if (
        attributeName === 'aria-checked' &&
        isDropdownOption(target) &&
        moved &&
        target.closest('.gaia-argoui-selectmenu')
      ) {
        // An option was chosen, so the menu is on its way out
        revert();
      }
    },

    handleEscape() {
      if (!moved) return false;
      revert();
      returnToStep();
      return true;
    },

    restore: revert,
  };
};
