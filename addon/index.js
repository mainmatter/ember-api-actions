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

export async function apiAction(
  record,
  { requestType = 'updateRecord', method, path, data, adapterOptions }
) {
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

  let snapshot = record._createSnapshot();

  if (adapterOptions) {
    snapshot.adapterOptions = adapterOptions;
  }

  let baseUrl = adapter.buildURL(modelName, record.id, snapshot, requestType);
  let url = path ? `${baseUrl}/${path}` : baseUrl;

  return await adapter.ajax(url, method, { data });
}

/** @experimental */
export async function adapterAction(
  adapter,
  modelName,
  { requestType = 'createRecord', method, path, data }
) {
  assert(`Missing \`method\` option`, method);
  assert(
    [
      `Invalid \`method\` option: ${method}`,
      `Valid options: ${VALID_METHODS.join(', ')}`,
    ].join('\n'),
    VALID_METHODS.includes(method)
  );

  let baseUrl = adapter.buildURL(modelName, null, null, requestType);
  let url = path ? `${baseUrl}/${path}` : baseUrl;

  return await adapter.ajax(url, method, { data });
}
