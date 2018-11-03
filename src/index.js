import { stringify } from 'query-string';
import merge from 'deepmerge';
import axios from 'axios';
import {
  GET_LIST,
  GET_ONE,
  CREATE,
  UPDATE,
  DELETE,
  GET_MANY,
} from './actions';

import defaultSettings from './default-settings';
import { NotImplementedError } from './errors';
import init from './initializer';

// Set HTTP interceptors.
init();

/**
 * Maps react-admin queries to a JSONAPI REST API
 *
 * @param {string} apiUrl the base URL for the JSONAPI
 * @param {string} userSettings Settings to configure this client.
 *
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the request type
 * @returns {Promise} the Promise for a data response
 */
export default (apiUrl, userSettings = {}) => (type, resource, params) => {
  let url = '';
  const settings = merge(defaultSettings, userSettings);

  const options = {
    headers: settings.headers,
  };

  switch (type) {
    case GET_LIST: {
      const { page, perPage } = params.pagination;
      // TODO: Allow sorting, filtering etc.
      const query = {
        'range[0]': page * perPage,
        'range[1]': (page + 1) * perPage,
      };
      url = `${apiUrl}/${resource}?${stringify(query)}`;
      break;
    }

    case GET_ONE:
      url = `${apiUrl}/${resource}/${params.id}`;
      break;

    case CREATE:
      url = `${apiUrl}/${resource}`;
      options.method = 'POST';
      options.data = JSON.stringify(params.data);
      break;

    case UPDATE: {
      url = `${apiUrl}/${resource}/${params.id}`;

      options.method = 'PUT';
      options.data = JSON.stringify(params.data);
      break;
    }

    case DELETE:
      url = `${apiUrl}/${resource}/${params.id}`;
      options.method = 'DELETE';
      break;

    case GET_MANY: {
      const query = {
        filter: JSON.stringify({ ids: params.ids }),
      };
      url = `${apiUrl}/${resource}?${stringify(query)}`;
      break;
    }

    default:
      throw new NotImplementedError(`Unsupported Data Provider request type ${type}`);
  }

  return axios({ url, ...options })
    .then((response) => {
      switch (type) {
        case GET_LIST:
        case GET_MANY: {
          return {
            data: response.data.data,
            total: response.data.meta[settings.total],
          };
        }

        case GET_ONE: {
          return response.data;
        }

        case CREATE: {
          return response.data;
        }

        case UPDATE: {
          return response.data;
        }

        case DELETE: {
          return {
            data: { id: params.id },
          };
        }

        default:
          throw new NotImplementedError(`Unsupported Data Provider request type ${type}`);
      }
    });
};
