'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.send = send;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _uriParams = require('uri-params');

var _uriParams2 = _interopRequireDefault(_uriParams);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_request2.default.defaults.pool = {
    pool: { maxSockets: Infinity }
};

/**
 * Send http request.
 *
 * @param options
 * @return {Promise.<*>}
 */
//common lib
function send(options = {}) {

    //compile uri params.
    if (options.url && options.params) {
        options.url = (0, _uriParams2.default)(options.url, options.params);
    }

    //set default configuration.
    options.resolveWithFullResponse = options.resolveWithFullResponse || true;
    options.json = options.json || true;

    return (0, _requestPromise2.default)(options);
}