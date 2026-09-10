const isModal = (element) =>
  element.classList.contains('ocean-ui-dialog') || element.classList.contains('modal-dialog');

/** Kintone's own modals (lookup pickers, user selects) get the spotlight while open. */
export const createModalHandler = ({ highlight, returnToStep }) => ({
  nodeAdded(node) {
    if (isModal(node)) {
      highlight(node);
    }
  },

  nodeRemoved(node) {
    if (isModal(node)) {
      returnToStep();
    }
  },
});
