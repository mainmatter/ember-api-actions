import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { customAction } from 'ember-data-custom-actions';
import { ServerError } from '@ember-data/adapter/error';

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

    let response = await customAction(user, { method: 'POST', path: 'like' });
    assert.deepEqual(response, { success: true });
  });

  test('it fails as expected', async function (assert) {
    let { worker, rest, user } = await prepare(this);

    worker.use(
      rest.post('/users/42/like', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await assert.rejects(
      customAction(user, { method: 'POST', path: 'like' }),
      ServerError
    );
  });
});
