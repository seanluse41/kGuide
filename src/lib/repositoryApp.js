import { t } from './i18n.js';

/**
 * Creates the kintone app that stores every guide in the domain, and returns
 * its new app ID.
 */

const POSITIONS = ['right', 'left', 'top', 'bottom'];

const REPOSITORY_FIELDS = {
  id: {
    type: 'SINGLE_LINE_TEXT',
    code: 'id',
    label: 'App ID',
    noLabel: false,
    required: true,
    unique: true,
  },
  stepsTable: {
    type: 'SUBTABLE',
    code: 'stepsTable',
    label: 'Guide Steps',
    fields: {
      number: { type: 'NUMBER', code: 'number', label: 'Step Number', noLabel: false, required: true },
      field: { type: 'SINGLE_LINE_TEXT', code: 'field', label: 'Field', noLabel: false, required: true },
      title: { type: 'SINGLE_LINE_TEXT', code: 'title', label: 'Title', noLabel: false, required: false },
      description: { type: 'MULTI_LINE_TEXT', code: 'description', label: 'Description', noLabel: false, required: false },
      position: {
        type: 'DROP_DOWN',
        code: 'position',
        label: 'Position',
        noLabel: false,
        required: false,
        defaultValue: 'right',
        options: Object.fromEntries(
          POSITIONS.map((value, index) => [value, { label: value, index }])
        ),
      },
    },
  },
};

export const createRepositoryApp = async () => {
  const { app } = await kintone.api(kintone.api.url('/k/v1/preview/app.json', true), 'POST', {
    name: t('guideRepositoryName'),
    description: t('guideRepositoryDescription'),
  });

  await kintone.api(kintone.api.url('/k/v1/preview/app/form/fields.json', true), 'POST', {
    app,
    properties: REPOSITORY_FIELDS,
  });

  await kintone.api(kintone.api.url('/k/v1/preview/app/deploy.json', true), 'POST', {
    apps: [{ app }],
  });

  return String(app);
};
