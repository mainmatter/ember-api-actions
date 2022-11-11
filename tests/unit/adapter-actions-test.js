import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { adapterAction } from '@mainmatter/ember-api-actions';
import { ServerError } from '@ember-data/adapter/error';

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
});
