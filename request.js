import 'whatwg-fetch';
import { isUndefined } from 'lodash';
import { errorCodes } from './constants';
import { getToken } from './misc';
import {API_URL} from './misc/api';

const {
  HTTP_200_OK,
  HTTP_300_MULTIPLE_CHOICES,
  HTTP_204_NO_CONTENT
} = errorCodes;

const POST_OPTIONS = {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

const PUT_OPTIONS = {
  method: 'PUT',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

const PATCH_OPTIONS = {
  method: 'PATCH',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

const AuthOptions = async method => ({
  method: method,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await getToken()}`
  }
});

const GET_OPTIONS = {
  method: 'GET'
};

function checkRequestStatus(response) {
  if (response.status === HTTP_204_NO_CONTENT) return {};

  const json = response.json();

  if (
    // What is the logic here
    response.status >= HTTP_200_OK &&
    response.status < HTTP_300_MULTIPLE_CHOICES
  ) {
    return json;
  }

  return json.then(err => {
    // What is the logic here
    console.log(response);
    const error = new Error(response.status);
    error.body = err;
    error.errorStatus = response.status;
    error.errorMessage = err.errors;
    error.message = err.message;
    throw error;
  });
}

/**
 * @param {string} url The URL we want to request
 * @param {object} [options] The options we wan to pass to fetch api
 * @return {object} The response data
 */

export default async function(
  url,
  method,
  options,
  errorHandler,
  isExternalApi
) {

  const ROOT_URL = isExternalApi ? url : `${API_URL}${url}`;
  let errHandler = errorHandler;
  if (isUndefined(errHandler)) {
    errHandler = err => {
      throw err;
    };
  }

  let bakedOptions;
  const met = typeof method === 'string' ? method : '';
  switch ((met || '').toUpperCase()) {
    case 'PUT':
      bakedOptions = PUT_OPTIONS;
      break;
    case 'POST':
      bakedOptions = POST_OPTIONS;
      break;
    case 'PATCH':
      bakedOptions = PATCH_OPTIONS;
      break;
    case 'GET_AUTH':
      console.log(await getToken(), '---get token');
      bakedOptions = await AuthOptions('GET');
      break;
    case 'POST_AUTH':
      bakedOptions = await AuthOptions('POST');
      break;
    case 'PATCH_AUTH':
      bakedOptions = await AuthOptions('PATCH');
      break;
    case 'PUT_AUTH':
      bakedOptions = await AuthOptions('PUT');
      break;
    case 'DELETE_AUTH':
      bakedOptions = await AuthOptions('DELETE');
      break;
    default:
      bakedOptions = GET_OPTIONS;
  }
  return fetch(ROOT_URL, {
    ...bakedOptions,
    ...options
  })
    .then(checkRequestStatus)
    .catch(errHandler);
}
