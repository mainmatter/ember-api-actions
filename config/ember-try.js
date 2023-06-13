'use strict';

const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    usePnpm: true,
    scenarios: [
      {
        name: 'ember-data-3.28',
        npm: {
          devDependencies: {
            'ember-data': '3.28.12',
          },
        },
      },
      {
        name: 'ember-data-4.4',
        npm: {
          devDependencies: {
            'ember-data': '4.4.1',
          },
        },
      },
      {
        name: 'ember-data-4.7',
        npm: {
          devDependencies: {
            'ember-data': '4.7.3',
          },
        },
      },
      {
        name: 'ember-data-4.8',
        npm: {
          devDependencies: {
            'ember-data': '4.8.2',
          },
        },
      },
      {
        name: 'ember-data-4.11',
        npm: {
          devDependencies: {
            'ember-data': '4.11.3',
          },
        },
      },
      {
        name: 'ember-data-4.12',
        npm: {
          devDependencies: {
            'ember-data': '4.12.0',
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
