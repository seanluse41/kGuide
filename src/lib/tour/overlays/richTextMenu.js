const isRichTextMenu = (element) => element.classList.contains('goog-menu');

/** The font/size menus inside a rich text field's toolbar. */
export const createRichTextMenuHandler = ({ highlight, returnToStep }) => {
  let open = null;

  const onMenuClick = (event) => {
    if (event.target.closest('[role="menuitem"]')) {
      close();
    }
  };

  const close = () => {
    if (!open) return;
    open.removeEventListener('click', onMenuClick);
    open = null;
    returnToStep();
  };

  return {
    attributeChanged(target, attributeName) {
      if (attributeName !== 'style' || !isRichTextMenu(target)) return;

      const hidden = target.style.display === 'none';
      if (!hidden && !open) {
        open = target;
        target.addEventListener('click', onMenuClick);
        highlight(target);
      } else if (hidden && open) {
        close();
      }
    },

    handleEscape() {
      if (!open) return false;
      close();
      return true;
    },

    restore() {
      open?.removeEventListener('click', onMenuClick);
      open = null;
    },
  };
};
