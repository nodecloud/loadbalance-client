//common lib
import request from 'request';
import rp from 'request-promise';
import uriParams from 'uri-params';

request.defaults.pool = {
    pool: {maxSockets: Infinity}
};

/**
 * Send http request.
 *
 * @param options
 * @return {Promise.<*>}
 */
export async function send(options = {}) {

    //compile uri params.
    if (options.url && options.params) {
        options.url = uriParams(options.url, options.params);
    }

    //set default configuration.
    options.resolveWithFullResponse = options.resolveWithFullResponse || true;
    options.json = options.json || true;

    try {
        let response = await rp(options);

        return response;
    } catch (e) {
        throw e;
    }
}
