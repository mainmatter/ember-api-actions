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
  { requestType = 'updateRecord', method, path = '', data, adapterOptions }
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
  let url;
  const [baseUrlNoQueries, baseQueries] = baseUrl.split('?');
  const [pathNoQueries, pathQueries] = path.split('?');

  if (baseUrlNoQueries.charAt(baseUrl.length - 1) === '/') {
    url = `${baseUrlNoQueries}${pathNoQueries}`;
  } else {
    url = `${baseUrlNoQueries}/${pathNoQueries}`;
  }

  const baseSearchParams = new URLSearchParams(baseQueries);
  const pathSearchParams = new URLSearchParams(pathQueries);
  for (const [k, v] of pathSearchParams) {
    baseSearchParams.set(k, v);
  }
  url = `${url}?${baseSearchParams.toString()}`;

  return await adapter.ajax(url, method, { data });
}

/** @experimental */
export async function adapterAction(
  adapter,
  modelName,
  { requestType = 'createRecord', method, path = '', data }
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
  let url;
  const [baseUrlNoQueries, baseQueries] = baseUrl.split('?');
  const [pathNoQueries, pathQueries] = path.split('?');

  if (baseUrlNoQueries.charAt(baseUrl.length - 1) === '/') {
    url = `${baseUrlNoQueries}${pathNoQueries}`;
  } else {
    url = `${baseUrlNoQueries}/${pathNoQueries}`;
  }

  const baseSearchParams = new URLSearchParams(baseQueries);
  const pathSearchParams = new URLSearchParams(pathQueries);
  for (const [k, v] of pathSearchParams) {
    baseSearchParams.set(k, v);
  }
  url = `${url}?${baseSearchParams.toString()}`;

  return await adapter.ajax(url, method, { data });
}
