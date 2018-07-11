//common lib
import _ from 'lodash';
import request from 'request';
import rp from 'request-promise';
import uriParams from 'uri-params';

/**
 * Send http request.
 *
 * @param options
 * @return {Promise.<*>}
 */
export function send(options = {}) {

    //compile uri params.
    if (options.url && options.params) {
        options.url = uriParams(options.url, options.params);
    }

    //set default configuration.
    if (!_.has(options, 'resolveWithFullResponse')) {
        options.resolveWithFullResponse = true;
    }
    if (!_.has(options, 'json')) {
        options.json = true;
    }

    return rp(options);
}

export function upload(options) {
    //compile uri params.
    if (options.url && options.params) {
        options.url = uriParams(options.url, options.params);
    }

    //set default configuration.
    if (!_.has(options, 'resolveWithFullResponse')) {
        options.resolveWithFullResponse = true;
    }
    if (!_.has(options, 'json')) {
        options.json = true;
    }

    return request(options);
}
