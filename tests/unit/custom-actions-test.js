import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { apiAction } from '@mainmatter/ember-api-actions';
import { ServerError } from '@ember-data/adapter/error';
import RESTAdapter from '@ember-data/adapter/rest';

module('customAction()', function (hooks) {
  setupTest(hooks);

  async function prepare(context) {
    let { worker, rest } = window.msw;

    worker.use(
      rest.get('/users/42', (req, res, ctx) => {
        return res(ctx.json({ user: { id: '42', name: 'rwjblue' } }));
      }),

      rest.post('/users/42/like', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );

    let store = context.owner.lookup('service:store');
    let user = await store.findRecord('user', '42');

    return { worker, rest, user };
  }

  test('it works', async function (assert) {
    let { user } = await prepare(this);

    let response = await apiAction(user, { method: 'POST', path: 'like' });
    assert.deepEqual(response, { success: true });
  });

  test('requestType option changes the base URL', async function (assert) {
    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users', (req, res, ctx) => {
        return res(ctx.json({ requestType: 'works' }));
      })
    );

    let response = await apiAction(user, {
      method: 'POST',
      requestType: 'createRecord',
    });
    assert.deepEqual(response, { requestType: 'works' });
  });

  test('it fails as expected', async function (assert) {
    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users/42/like', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await assert.rejects(
      apiAction(user, { method: 'POST', path: 'like' }),
      ServerError
    );
  });

  test('buildURL() can use the snapshot parameter', async function (assert) {
    class UserAdapter extends RESTAdapter {
      buildURL(modelName, id, snapshot, requestType) {
        if (requestType === 'updateRecord') {
          return `/users/${snapshot.record.name}`;
        } else {
          return super.buildURL(...arguments);
        }
      }
    }

    this.owner.register('adapter:user', UserAdapter);

    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users/rwjblue/like', (req, res, ctx) => {
        return res(ctx.json({ custom: 'buildURL' }));
      })
    );

    let response = await apiAction(user, { method: 'POST', path: 'like' });
    assert.deepEqual(response, { custom: 'buildURL' });
  });

  test('snapshot can receive adapterOptions', async function (assert) {
    class UserAdapter extends RESTAdapter {
      buildURL(modelName, id, snapshot) {
        if (snapshot.adapterOptions?.test === true) {
          return `/users/it-works`;
        } else {
          return super.buildURL(...arguments);
        }
      }
    }

    this.owner.register('adapter:user', UserAdapter);

    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users/it-works/like', (req, res, ctx) => {
        return res(ctx.json({ adapterOptions: 'it works' }));
      })
    );

    let response = await apiAction(user, {
      method: 'POST',
      path: 'like',
      adapterOptions: { test: true },
    });
    assert.deepEqual(response, { adapterOptions: 'it works' });
  });

  test('query params via `path` work correctly', async function (assert) {
    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users/42/foo', (req, res, ctx) => {
        let query = req.url.searchParams.get('query');
        return res(ctx.json({ query }));
      })
    );

    let response = await apiAction(user, {
      method: 'POST',
      path: 'foo?query=param',
    });
    assert.deepEqual(response, { query: 'param' });
  });
});
