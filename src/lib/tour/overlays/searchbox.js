const isSearchboxList = (element) =>
  element.classList.contains('entityselect-searchbox-list-cybozu');

/**
 * The suggestion list under a user/org/group picker. It is positioned
 * absolutely, which puts it outside the spotlight, so while it is open it is
 * laid out in flow instead and the step is re-driven to take it in.
 */
export const createSearchboxHandler = ({ returnToStep }) => {
  let tracked = null; // { element, position }

  const show = (element) => {
    if (tracked?.element === element) return;
    tracked = { element, position: element.style.position };
    element.style.position = 'static';
    returnToStep();
  };

  const hide = () => {
    if (!tracked) return;
    tracked.element.style.position = tracked.position;
    tracked = null;
    returnToStep();
  };

  return {
    nodeAdded(node) {
      if (isSearchboxList(node) && node instanceof HTMLElement) {
        show(node);
      }
    },

    nodeRemoved(node) {
      if (isSearchboxList(node)) {
        hide();
      }
    },

    attributeChanged(target, attributeName) {
      if (attributeName !== 'style' || !isSearchboxList(target)) return;
      if (target.style.display === 'none') {
        hide();
      } else {
        show(target);
      }
    },

    handleEscape() {
      if (!tracked) return false;
      hide();
      return true;
    },

    restore() {
      if (!tracked) return;
      tracked.element.style.position = tracked.position;
      tracked = null;
    },
  };
};
