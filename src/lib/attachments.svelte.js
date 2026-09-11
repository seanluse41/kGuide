import { Button } from 'kintone-ui-component';

/**
 * KUC widgets can't be written as tags in the markup. The library version is
 * part of every tag name — `kuc-text-1-26-0` — because a kintone page loads
 * every installed plugin at once and two plugins may be on different KUC
 * versions. Writing one in the markup would mean naming the version there and
 * editing it on each upgrade.
 *
 * So each widget is built from its exported class and put into the page by an
 * attachment, which is what Svelte offers for exactly this.
 *
 * One rule applies to everything here: an attachment runs again whenever state
 * read inside it changes. Anything that should happen once must not read
 * `$state` directly — pass a function and read it in a child effect, the way
 * `disabled` does below.
 */

/** Puts an already-built KUC widget in the page, and takes it out again. */
export const place = (widget) => (node) => {
  node.appendChild(widget);
  return () => widget.remove();
};

/**
 * A KUC button.
 *
 * @param {{text: string, type?: string, className?: string,
 *   onClick: () => void, disabled?: () => boolean}} options
 *   `disabled` is a function so that reading it stays inside the child effect.
 */
export const button =
  ({ text, type = 'normal', className, onClick, disabled }) =>
  (node) => {
    const widget = new Button({ text, type, className });
    widget.addEventListener('click', onClick);
    node.appendChild(widget);

    if (disabled) {
      $effect(() => {
        widget.disabled = disabled();
      });
    }

    return () => widget.remove();
  };
