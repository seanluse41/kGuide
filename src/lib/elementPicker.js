import { getFieldElement } from './fields.js';

const HIGHLIGHT_OUTLINE = '2px solid #3498db';

/**
 * Lets the user point at a field and click to add it to a guide.
 *
 * This replaces the `pick-dom-element` dependency. That library drew its own
 * overlay box, but kGuide never used it — the hover handler always outlined the
 * resolved *field* container instead of the raw node under the cursor, so all
 * that was really needed was hover/click capture, which is what this does.
 */
export class ElementPicker {
  #onPick = null;
  #highlighted = null;
  #ignoreSelector;

  /** @param {{ignoreSelector?: string}} [options] regions the picker won't react to */
  constructor({ ignoreSelector = '' } = {}) {
    this.#ignoreSelector = ignoreSelector;
  }

  /** @param {(field: HTMLElement) => void} onPick called with the picked field container */
  start(onPick) {
    if (this.#onPick) {
      this.stop();
    }
    this.#onPick = onPick;
    document.addEventListener('mousemove', this.#onMouseMove, true);
    document.addEventListener('click', this.#onClick, true);
  }

  stop() {
    document.removeEventListener('mousemove', this.#onMouseMove, true);
    document.removeEventListener('click', this.#onClick, true);
    this.#onPick = null;
    this.#highlight(null);
  }

  get active() {
    return this.#onPick !== null;
  }

  #resolve(target) {
    if (!(target instanceof HTMLElement)) return null;
    if (this.#ignoreSelector && target.closest(this.#ignoreSelector)) return null;
    return getFieldElement(target);
  }

  // Arrow-function fields, so the same reference can be added and removed as a
  // listener without binding (a private method can't be reassigned).
  #onMouseMove = (event) => {
    this.#highlight(this.#resolve(event.target));
  };

  #onClick = (event) => {
    const field = this.#resolve(event.target);
    if (!field) return;

    // Swallow the click so picking a field doesn't also start editing it
    event.preventDefault();
    event.stopPropagation();

    this.#onPick?.(field);
    this.#highlight(null);
  };

  #highlight(element) {
    if (this.#highlighted === element) return;
    if (this.#highlighted) {
      this.#highlighted.style.outline = '';
    }
    if (element) {
      element.style.outline = HIGHLIGHT_OUTLINE;
    }
    this.#highlighted = element;
  }
}
