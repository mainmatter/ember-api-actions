import { assert } from '@ember/debug';

const VALID_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH',
];

export async function apiAction(record, { method, path, data }) {
  assert(`Missing \`method\` option`, method);
  assert(
    [
      `Invalid \`method\` option: ${method}`,
      `Valid options: ${VALID_METHODS.join(', ')}`,
    ].join('\n'),
    VALID_METHODS.includes(method)
  );

  let modelClass = record.constructor;
  let modelName = modelClass.modelName;
  let adapter = record.store.adapterFor(modelName);

  let requestType = 'updateRecord';
  let baseUrl = adapter.buildURL(modelName, record.id, null, requestType);
  let url = path ? `${baseUrl}/${path}` : baseUrl;

  return await adapter.ajax(url, method, { data });
}
