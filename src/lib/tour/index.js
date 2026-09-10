import { driver } from 'driver.js';
import { t } from '../i18n.js';
import { openAllFieldGroups } from '../fields.js';
import { watchOverlays } from './observers.js';

/**
 * Runs a guide.
 *
 * @param {Array} steps driver.js steps, as returned by `getGuideSteps`
 * @returns {Promise<{destroy: () => void}>}
 */
export const startTour = async (steps) => {
  // A field inside a collapsed group can't be highlighted
  await openAllFieldGroups();

  let overlays = null;
  let resizeObserver = null;
  let onKeyDown = null;

  const stopWatchingResize = () => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const tour = driver({
    steps,
    animate: true,
    showProgress: true,
    allowClose: false,
    popoverClass: 'kguide-popover',
    // driver.js substitutes the counts itself, so the placeholders pass through
    progressText: t('progressText', { current: '{{current}}', total: '{{total}}' }),
    nextBtnText: t('next'),
    prevBtnText: t('previous'),
    doneBtnText: t('finish'),

    // A highlighted field can change size as the user types into it, so the
    // spotlight is re-measured whenever it does.
    onHighlightStarted: (element) => {
      stopWatchingResize();
      if (element instanceof HTMLElement) {
        resizeObserver = new ResizeObserver(() => tour.refresh());
        resizeObserver.observe(element);
      }
    },

    onDeselected: stopWatchingResize,

    onDestroyed: () => {
      stopWatchingResize();
      overlays?.disconnect();
      if (onKeyDown) {
        document.removeEventListener('keydown', onKeyDown);
        onKeyDown = null;
      }
    },

    // `allowClose` is off so a stray click can't end the tour by accident;
    // this gives every step but the last an explicit way out.
    onPopoverRender: (popover, { state }) => {
      if ((state?.activeIndex ?? 0) >= steps.length - 1) return;

      const finishButton = document.createElement('button');
      finishButton.innerText = t('finish');
      finishButton.addEventListener('click', () => tour.destroy());
      popover.footerButtons.appendChild(finishButton);
    },
  });

  overlays = watchOverlays(tour);

  // One escape handler, not two. Escape closes whichever kintone overlay is
  // open, and only ends the tour when none of them claim it.
  onKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    if (overlays.handleEscape()) {
      event.preventDefault();
      return;
    }
    tour.destroy();
  };
  document.addEventListener('keydown', onKeyDown);

  tour.drive();

  return { destroy: () => tour.destroy() };
};
