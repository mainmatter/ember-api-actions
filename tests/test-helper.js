import Application from 'dummy/app';
import config from 'dummy/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { setupWorker, rest } from 'msw';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

QUnit.begin(() => {
  let worker = setupWorker();
  worker.start({ quiet: location.search.includes('quiet-msw') });

  window.msw = { worker, rest };
});

QUnit.testStart(() => {
  window.msw.worker.resetHandlers();
});

QUnit.done(() => {
  window.msw.worker.stop();
});

start();
