/**
 * Helpers for locating the kintone field element behind an arbitrary node in
 * the record form, and for reading back the selector a tour step should target.
 */

const FIELD_CLASS_PATTERNS = [
  /^field-\d{1,9}$/, // most fields
  /^6_-\d{1,9}$/, // some fields carry a 6_ prefix
  /^subtable-\d{1,9}$/, // tables
];

const matchFieldClass = (element) =>
  Array.from(element.classList).find((className) =>
    FIELD_CLASS_PATTERNS.some((pattern) => pattern.test(className))
  ) || null;

/** Walks up from `element` to the nearest kintone field container. */
export const getFieldElement = (element) => {
  let current = element;
  while (current) {
    if (matchFieldClass(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/** The class a tour step targets, e.g. `field-1234567`. */
export const getFieldClass = (element) => matchFieldClass(element);

/** The field's on-screen label, used to identify it while building a guide. */
export const getFieldLabel = (element) => {
  const label = element.querySelector('.control-label-text-gaia');
  const text = label?.textContent?.trim();
  return text || null;
};

/**
 * Fields inside a collapsed group can't be highlighted or picked, so every
 * group is expanded before a tour runs or a guide is built.
 */
export const openAllFieldGroups = async () => {
  try {
    const { layout } = await kintone.api(
      kintone.api.url('/k/v1/app/form/layout', true),
      'GET',
      { app: kintone.app.getId() }
    );

    const open = (rows) => {
      for (const row of rows || []) {
        if (row.type === 'GROUP' && row.code) {
          kintone.app.record.setGroupFieldOpen(row.code, true);
        }
        open(row.layout);
        open(row.fields);
      }
    };

    open(layout);
  } catch (error) {
    console.error('Error opening field groups:', error);
  }
};
