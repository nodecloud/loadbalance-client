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
    const logger = options.logger || console;

    //compile uri params.
    if (options.url && options.params) {
        options.url = uriParams(options.url, options.params);
    }

    logger.info(`It will send request. the request options is ${JSON.stringify(options)}`);

    //set default configuration.
    options.resolveWithFullResponse = options.resolveWithFullResponse || false;
    options.simple = options.simple || false;
    options.json = options.json || true;

    try {
        let response = await rp(options);

        logger.info(`Response success, response status code is ${response.statusCode}, body is ${JSON.stringify(response.body)}`);

        return response;
    } catch (e) {
        logger.error('Invoke other service\'s api error.', e);
        throw e;
    }
}