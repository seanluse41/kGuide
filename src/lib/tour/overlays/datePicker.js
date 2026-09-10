const isDatePicker = (element) => element.classList.contains('goog-popupdatepicker');

const isPickerMenu = (element, containerClass) =>
  element.classList.contains('gaia-argoui-forms-datepicker-selectmenu') &&
  element.parentElement?.classList.contains(containerClass) === true;

const isYearPicker = (element) => isPickerMenu(element, 'goog-date-picker-year-container');
const isMonthPicker = (element) => isPickerMenu(element, 'goog-date-picker-month-container');

/**
 * The date picker, plus the year and month menus that open on top of it. Each
 * one is highlighted as it opens, and closing a year/month menu hands the
 * spotlight back to the calendar rather than to the field behind it.
 */
export const createDatePickerHandler = ({ highlight, returnToStep }) => {
  let calendar = null;
  let submenu = null; // { element, observer }

  // The year and month menus don't fire a style change when a value is picked,
  // they just flip aria-checked on the chosen entry.
  const watchForSelection = (element, onSelected) => {
    const observer = new MutationObserver((mutations) => {
      const selected = mutations.some(
        (mutation) =>
          mutation.attributeName === 'aria-checked' &&
          mutation.target.getAttribute('aria-checked') === 'true'
      );
      if (selected) {
        onSelected();
      }
    });
    observer.observe(element, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-checked'],
    });
    return observer;
  };

  const openSubmenu = (element) => {
    if (submenu) return;
    submenu = { element, observer: watchForSelection(element, closeSubmenu) };
    highlight(element);
  };

  const closeSubmenu = () => {
    if (!submenu) return;
    submenu.observer.disconnect();
    submenu = null;

    if (calendar) {
      highlight(calendar);
    } else {
      returnToStep();
    }
  };

  const closeCalendar = () => {
    closeSubmenuQuietly();
    if (!calendar) return;
    calendar = null;
    returnToStep();
  };

  const closeSubmenuQuietly = () => {
    submenu?.observer.disconnect();
    submenu = null;
  };

  return {
    attributeChanged(target, attributeName) {
      if (attributeName !== 'style') return;

      const hidden = target.style.display === 'none';

      if (isDatePicker(target)) {
        if (!hidden && !calendar) {
          calendar = target;
          highlight(target);
        } else if (hidden && calendar) {
          closeCalendar();
        }
      } else if (isYearPicker(target) || isMonthPicker(target)) {
        if (!hidden) {
          openSubmenu(target);
        } else {
          closeSubmenu();
        }
      }
    },

    handleEscape() {
      if (submenu) {
        closeSubmenu();
        return true;
      }
      if (calendar) {
        closeCalendar();
        return true;
      }
      return false;
    },

    restore() {
      closeSubmenuQuietly();
      calendar = null;
    },
  };
};
