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

  module('when adapter buildURL returns with query params', function (hooks) {
    hooks.beforeEach(function () {
      class UserAdapter extends RESTAdapter {
        buildURL(modelName, id, snapshot, requestType) {
          let url = super.buildURL(modelName, id, snapshot, requestType);
          let params = new URLSearchParams({ order: 'asc' });
          return `${url}?${params.toString()}`;
        }
      }
      this.owner.register('adapter:user', UserAdapter);
    });

    test('should handle query params', async function (assert) {
      assert.expect(2);
      let { worker, rest, user } = await prepare(this);

      worker.use(
        rest.post('/users?order=asc', (req, res, ctx) => {
          assert.strictEqual(
            req.url.searchParams.get('order'),
            'asc',
            'request made to the right URL'
          );
          return res(ctx.json({ adapterOptions: 'it works' }));
        })
      );

      let response = await apiAction(user, {
        method: 'POST',
        requestType: 'createRecord',
      });
      assert.deepEqual(response, { adapterOptions: 'it works' });
    });

    test('should handle query params and path params', async function (assert) {
      assert.expect(3);
      let { worker, rest, user } = await prepare(this);

      worker.use(
        rest.post('/users/42/like?order=asc', (req, res, ctx) => {
          assert.strictEqual(
            req.url.searchParams.get('order'),
            'asc',
            'request param order has the correct value'
          );
          assert.strictEqual(
            req.url.searchParams.get('limit'),
            '10',
            'request param limit has the correct value'
          );
          return res(ctx.json({ adapterOptions: 'it works' }));
        })
      );

      let response = await apiAction(user, {
        method: 'POST',
        path: 'like?limit=10',
      });
      assert.deepEqual(response, { adapterOptions: 'it works' });
    });

    module('when adapter buildURL and path query params conflict', function () {
      test('should choose to keep path query params', async function (assert) {
        assert.expect(2);
        let { worker, rest, user } = await prepare(this);

        worker.use(
          rest.post('/users/42/like?order=asc', (req, res, ctx) => {
            assert.strictEqual(
              req.url.searchParams.get('order'),
              'desc',
              'request param order has the correct value'
            );
            return res(ctx.json({ adapterOptions: 'it works' }));
          })
        );

        let response = await apiAction(user, {
          method: 'POST',
          path: 'like?order=desc',
        });
        assert.deepEqual(response, { adapterOptions: 'it works' });
      });
    });
  });
});
