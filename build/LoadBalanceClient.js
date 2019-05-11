'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Util = require('./Util');

var _HttpClient = require('./HttpClient');

var http = _interopRequireWildcard(_HttpClient);

var _LoadBalance = require('./LoadBalance');

var loadBalance = _interopRequireWildcard(_LoadBalance);

var _ServiceWatcher = require('./ServiceWatcher');

var _ServiceWatcher2 = _interopRequireDefault(_ServiceWatcher);

var _RefreshingEvent = require('./RefreshingEvent');

var _RefreshingEvent2 = _interopRequireDefault(_RefreshingEvent);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const REFRESHING_SERVICE_LIST_EVENT = 'refreshing-services';
const REFRESHING_SERVICE_LIST_ERROR_EVENT = 'refreshing-services-error';

/**
 * An http client with load balance.
 */
class LoadBalanceClient {
    constructor(serviceName, consul, options = {}) {
        this.options = options = options || {};
        this.requestOptions = options.request || {};
        this.serviceName = serviceName;
        this.consul = consul;
        this.engineCache = {};
        this.watcher = new _ServiceWatcher2.default(serviceName, consul, options);
        this.initWatcher();
        this.event = new _RefreshingEvent2.default();

        this.preSend = () => {};
        this.postSend = () => {};
    }

    onPreSend(callback) {
        if (typeof callback === 'function') {
            this.preSend = callback;
        }
    }

    onPostSend(callback) {
        if (typeof callback === 'function') {
            this.postSend = callback;
        }
    }

    on(eventName, callback) {
        this.event.on(eventName, callback);
    }

    off(eventName, callback) {
        this.event.removeListener(eventName, callback);
    }

    getRequestOptions(service, options) {
        var _this = this;

        return _asyncToGenerator(function* () {
            if (!options) {
                throw new Error(`No options was given, please give an options before send api request.`);
            }

            for (let key in _this.requestOptions) {
                if (!_this.requestOptions.hasOwnProperty(key) || options[key]) {
                    continue;
                }

                options[key] = _this.requestOptions[key];
            }
            const address = yield _this.getAddress(service);

            const request = {};
            for (let key in options) {
                if (!options.hasOwnProperty(key)) {
                    continue;
                }

                if (key === 'url') {
                    request[key] = `${options.scheme || 'http'}://${address}${options[key]}`;
                } else {
                    request[key] = options[key];
                }
            }
            return request;
        })();
    }

    upload(options) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            const service = yield _this2.getService();
            const request = yield _this2.getRequestOptions(service, options);
            const newRequest = _this2.preSend(request);
            const requestObj = _extends({}, request, newRequest);
            try {
                const stream = http.upload(requestObj);
                _this2.postSend(null, stream, requestObj);
                return stream;
            } catch (e) {
                _this2.postSend(e);
                if (!e.response) {
                    _this2.removeUnavailableNode(`${service.Service.Address}:${service.Service.Port}`);
                }
                throw e;
            }
        })();
    }

    send(options) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            const service = yield _this3.getService();
            const request = yield _this3.getRequestOptions(service, options);
            const newRequest = _this3.preSend(request);
            const requestObj = _extends({}, request, newRequest);

            try {
                const response = yield http.send(requestObj);
                _this3.postSend(null, response, requestObj);
                return response;
            } catch (e) {
                _this3.postSend(e);
                if (!e.response) {
                    _this3.removeUnavailableNode(`${service.Service.Address}:${service.Service.Port}`);
                }
                throw e;
            }
        })();
    }

    removeUnavailableNode(key) {
        const wrapper = this.engineCache[this.serviceName];
        if (wrapper) {
            const filterdServices = wrapper.pool.filter(service => {
                return `${service.Service.Address}:${service.Service.Port}` !== key;
            });
            this.engineCache[this.serviceName] = {
                pool: filterdServices,
                engine: loadBalance.getEngine(filterdServices, this.options.strategy || loadBalance.RANDOM_ENGINE),
                hash: (0, _Util.md5)(JSON.stringify(filterdServices))
            };
        }
    }

    get(options = {}) {
        options.method = 'GET';
        return this.send(options);
    }

    post(options = {}) {
        options.method = 'POST';
        return this.send(options);
    }

    del(options = {}) {
        options.method = 'DELETE';
        return this.send(options);
    }

    put(options = {}) {
        options.method = 'PUT';
        return this.send(options);
    }

    /**
     * Get a http address.
     * @return {Promise.<string>}
     */
    getAddress(service) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            if (!service) {
                throw new Error(`No service '${_this4.serviceName}' was found.`);
            }

            if (service.Service.Port === 80 || !service.Service.Address) {
                return service.Service.Address;
            }

            return `${service.Service.Address}:${service.Service.Port}`;
        })();
    }

    /**
     * Get a available service by load balance.
     * @return {Promise.<void>}
     */
    getService() {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            if (!_this5.engineCache[_this5.serviceName]) {
                let options = _this5.options;
                options.service = _this5.serviceName;
                if (!_lodash2.default.has(options, 'passing')) {
                    options.passing = true;
                }

                const services = yield new Promise(function (resolve, reject) {
                    _this5.consul.health.service(options, function (err, result) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(result);
                    });
                });

                const wrapper = {
                    pool: services,
                    engine: loadBalance.getEngine(services, _this5.options.strategy || loadBalance.RANDOM_ENGINE),
                    hash: (0, _Util.md5)(JSON.stringify(services))
                };

                _this5.engineCache[_this5.serviceName] = wrapper;

                _this5.event.emit(REFRESHING_SERVICE_LIST_EVENT, services, wrapper.engine._pool);
            }

            return _this5.engineCache[_this5.serviceName].engine.pick();
        })();
    }

    /**
     * Init consul services change listener.
     */
    initWatcher() {
        this.watcher.watch();
        this.watcher.change(services => {
            let wrapper = this.engineCache[this.serviceName];
            let hash = (0, _Util.md5)(JSON.stringify(services));
            if (wrapper && hash !== wrapper.hash) {
                wrapper.pool = services;
                wrapper.engine.update(services);
                wrapper.hash = hash;
            } else if (!wrapper) {
                wrapper = {
                    pool: services,
                    engine: loadBalance.getEngine(services, loadBalance.RANDOM_ENGINE),
                    hash: hash
                };
            }

            this.event.emit(REFRESHING_SERVICE_LIST_EVENT, services, wrapper.engine._pool);
            this.engineCache[this.serviceName] = wrapper;
        });

        this.watcher.error(err => {
            this.event.emit(REFRESHING_SERVICE_LIST_ERROR_EVENT, err);
        });

        return this.watcher;
    }
}
exports.default = LoadBalanceClient;
module.exports = exports['default'];