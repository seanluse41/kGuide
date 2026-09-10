import { createDropdownHandler } from './overlays/dropdown.js';
import { createSearchboxHandler } from './overlays/searchbox.js';
import { createModalHandler } from './overlays/modal.js';
import { createRichTextMenuHandler } from './overlays/richTextMenu.js';
import { createDatePickerHandler } from './overlays/datePicker.js';
import { createLookupPopupHandler } from './overlays/lookupPopup.js';

const HANDLER_FACTORIES = [
  createModalHandler,
  createDropdownHandler,
  createSearchboxHandler,
  createRichTextMenuHandler,
  createDatePickerHandler,
  createLookupPopupHandler,
];

/**
 * Kintone opens dropdowns, date pickers, lookup dialogs and rich-text menus by
 * appending them to the end of `document.body`, which puts them outside the
 * element driver.js has highlighted — so the tour overlay covers them and they
 * become unclickable.
 *
 * This watches the document for those elements and hands each one to the
 * handler that knows how to keep it usable. Each overlay type lives in its own
 * module under `overlays/`; they share nothing but the context below.
 *
 * @param {object} driverObj the running driver.js instance
 * @returns {{disconnect: () => void, handleEscape: () => boolean}}
 */
export const watchOverlays = (driverObj) => {
  let returning = false;

  const context = {
    refresh: () => driverObj.refresh(),

    highlight: (element) => driverObj.highlight({ element }),

    /**
     * Puts the spotlight back on the step the tour is actually on, once a
     * handler has finished undoing whatever it did to an overlay.
     *
     * Each handler owns its own cleanup and calls this afterwards. The guard
     * keeps a handler that re-enters here during that cleanup from recursing;
     * the previous version's close/return pair could do exactly that.
     */
    returnToStep: () => {
      if (returning) return;
      returning = true;
      try {
        const activeIndex = driverObj.getActiveIndex();
        if (activeIndex === null || activeIndex === undefined) {
          driverObj.drive();
        } else {
          driverObj.moveTo(activeIndex);
        }
      } finally {
        returning = false;
      }
    },
  };

  const handlers = HANDLER_FACTORIES.map((create) => create(context));

  const dispatch = (hook, ...args) => {
    for (const handler of handlers) {
      handler[hook]?.(...args);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) dispatch('nodeAdded', node);
        }
        for (const node of mutation.removedNodes) {
          if (node instanceof Element) dispatch('nodeRemoved', node);
        }
      } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        dispatch('attributeChanged', mutation.target, mutation.attributeName);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded', 'aria-checked', 'style'],
  });

  return {
    disconnect: () => {
      observer.disconnect();
      for (const handler of handlers) {
        handler.restore?.();
      }
    },

    /**
     * Escape should close whatever overlay is open before it ends the tour.
     * @returns {boolean} true when a handler consumed the key press
     */
    handleEscape: () => handlers.some((handler) => handler.handleEscape?.() === true),
  };
};
