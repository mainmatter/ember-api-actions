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
  let url = addPath(baseUrl, path);

  return await adapter.ajax(url, method, { data });
}

/** @experimental */
export async function adapterAction(
  adapter,
  modelName,
  { requestType = 'createRecord', method, path, data, adapterOptions }
) {
  assert(`Missing \`method\` option`, method);
  assert(
    [
      `Invalid \`method\` option: ${method}`,
      `Valid options: ${VALID_METHODS.join(', ')}`,
    ].join('\n'),
    VALID_METHODS.includes(method)
  );

  let baseUrl = adapter.buildURL(
    modelName,
    null,
    { adapterOptions },
    requestType
  );
  let url = addPath(baseUrl, path);

  return await adapter.ajax(url, method, { data });
}

function addPath(baseUrl, path) {
  if (!path) return baseUrl;

  let url = new URL(baseUrl, location.href);

  let [pathname, search] = path.split('?', 2);
  url.pathname += `/${pathname}`;

  if (search) {
    new URLSearchParams(search).forEach((value, name) => {
      url.searchParams.append(name, value);
    });
  }

  return url.href;
}
