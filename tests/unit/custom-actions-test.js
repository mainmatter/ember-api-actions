import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { apiAction } from '@mainmatter/ember-api-actions';
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
});
