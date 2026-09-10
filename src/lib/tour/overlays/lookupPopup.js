const isLookupClearPopup = (element) => element.classList.contains('removelink-popup-cybozu');

/** The small "clear lookup" confirmation bubble. */
export const createLookupPopupHandler = ({ highlight, returnToStep }) => ({
  nodeAdded(node) {
    if (isLookupClearPopup(node)) {
      highlight(node);
    }
  },

  nodeRemoved(node) {
    if (isLookupClearPopup(node)) {
      returnToStep();
    }
  },
});
