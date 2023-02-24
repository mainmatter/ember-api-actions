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
      let { worker, rest, adapter } = await prepare(this);

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

      let response = await adapterAction(adapter, 'user', {
        method: 'POST',
        requestType: 'createRecord',
      });
      assert.deepEqual(response, { adapterOptions: 'it works' });
    });

    test('should handle query params and path params', async function (assert) {
      assert.expect(3);
      let { worker, rest, adapter } = await prepare(this);

      worker.use(
        rest.post('/users/like?order=asc', (req, res, ctx) => {
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

      let response = await adapterAction(adapter, 'user', {
        method: 'POST',
        path: 'like?limit=10',
      });
      assert.deepEqual(response, { adapterOptions: 'it works' });
    });

    module('when adapter buildURL and path query params conflict', function () {
      test('should choose to keep path query params', async function (assert) {
        assert.expect(2);
        let { worker, rest, adapter } = await prepare(this);

        worker.use(
          rest.post('/users/like?order=asc', (req, res, ctx) => {
            assert.strictEqual(
              req.url.searchParams.get('order'),
              'desc',
              'request param order has the correct value'
            );
            return res(ctx.json({ adapterOptions: 'it works' }));
          })
        );

        let response = await adapterAction(adapter, 'user', {
          method: 'POST',
          path: 'like?order=desc',
        });
        assert.deepEqual(response, { adapterOptions: 'it works' });
      });
    });
  });
});
