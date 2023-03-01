import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { adapterAction } from '@mainmatter/ember-api-actions';
import { ServerError } from '@ember-data/adapter/error';
import RESTAdapter from '@ember-data/adapter/rest';

module('adapterAction()', function (hooks) {
  setupTest(hooks);

  async function prepare(context) {
    let { worker, rest } = window.msw;

    worker.use(
      rest.post('/users/validate-email', (req, res, ctx) => {
        return res(ctx.json({ email: 'valid' }));
      })
    );

    let store = context.owner.lookup('service:store');
    let adapter = store.adapterFor('user');

    return { worker, rest, adapter };
  }

  test('it works', async function (assert) {
    let { adapter } = await prepare(this);

    let response = await adapterAction(adapter, 'user', {
      method: 'POST',
      path: 'validate-email',
    });
    assert.deepEqual(response, { email: 'valid' });
  });

  test('it fails as expected', async function (assert) {
    let { worker, rest, adapter } = await prepare(this);

    worker.use(
      rest.post('/users/validate-email', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await assert.rejects(
      adapterAction(adapter, 'user', {
        method: 'POST',
        path: 'validate-email',
      }),
      ServerError
    );
  });

  test('buildURL can receive adapterOptions', async function (assert) {
    class UserAdapter extends RESTAdapter {
      buildURL(modelName, id, { adapterOptions }) {
        let url = super.buildURL(...arguments);
        if (adapterOptions?.test === true) {
          return `${url}?test=true`;
        }
        return url;
      }
    }

    this.owner.register('adapter:user', UserAdapter);

    let { worker, rest, adapter } = await prepare(this);

    worker.use(
      rest.post('/users/my-action', (req, res, ctx) => {
        let body = {};
        if (req.url.searchParams.has('test')) {
          body.test = true;
        }
        return res(ctx.json(body));
      })
    );

    let responseA = await adapterAction(adapter, 'user', {
      method: 'POST',
      path: 'my-action',
      adapterOptions: { test: true },
    });
    assert.deepEqual(responseA, { test: true });

    let responseB = await adapterAction(adapter, 'user', {
      method: 'POST',
      path: 'my-action',
    });
    assert.deepEqual(responseB, {});
  });
});
