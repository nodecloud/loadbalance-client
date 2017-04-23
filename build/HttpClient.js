'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.send = send;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//common lib
_request2.default.defaults.pool = {
    pool: { maxSockets: Infinity }
};

/**
 * Send http request.
 *
 * @param options
 * @return {Promise.<*>}
 */
async function send(options = {}) {
    const logger = options.logger;

    //compile uri params.
    if (options.url && options.url.replace) {
        for (let key in options.params) {
            if (!options.params.hasOwnProperty(key)) {
                continue;
            }

            const re = new RegExp(':' + key, 'g');
            options.url = options.url.replace(re, options.params[key]);
        }
    }

    logger.info(`It will send request. the request options is ${JSON.stringify(options)}`);

    //set default configuration.
    options.resolveWithFullResponse = true;
    options.simple = false;
    options.json = true;

    try {
        let response = await (0, _requestPromise2.default)(options);

        logger.debug(`Response success, response status code is ${response.statusCode}, body is ${JSON.stringify(response.body)}`);

        return response;
    } catch (e) {
        logger.error('Invoke other service\'s api error.', e);
        throw e;
    }
}