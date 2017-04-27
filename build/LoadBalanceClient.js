'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Util = require('./Util');

var _HttpClient = require('./HttpClient');

var http = _interopRequireWildcard(_HttpClient);

var _LoadBalance = require('./LoadBalance');

var loadBalance = _interopRequireWildcard(_LoadBalance);

var _ServiceWatcher = require('./ServiceWatcher');

var _ServiceWatcher2 = _interopRequireDefault(_ServiceWatcher);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
    }

    send(options) {
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
            const endpoint = yield _this.getEndpoint();

            let request = {};
            for (let key in options) {
                if (!options.hasOwnProperty(key)) {
                    continue;
                }

                if (key === 'url') {
                    request[key] = endpoint + options[key];
                } else {
                    request[key] = options[key];
                }
            }

            return http.send(request);
        })();
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
     * Get a http endpoint.
     * @return {Promise.<string>}
     */
    getEndpoint() {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            let service = null;
            try {
                service = yield _this2.getService();
            } catch (e) {
                throw new Error('Get consul service error.');
            }

            if (!service) {
                throw new Error(`No service '${_this2.serviceName}' was found.`);
            }

            return `http://${service.Service.Address}:${service.Service.Port}`;
        })();
    }

    /**
     * Get a available service by load balance.
     * @return {Promise.<void>}
     */
    getService() {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            if (!_this3.engineCache[_this3.serviceName]) {
                let options = _this3.options;
                options.service = _this3.serviceName;
                if (!_lodash2.default.has(options, 'passing')) {
                    options.passing = true;
                }

                const services = yield new Promise(function (resolve, reject) {
                    _this3.consul.health.service(options, function (err, result) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(result);
                    });
                });

                _this3.engineCache[_this3.serviceName] = {
                    engine: loadBalance.getEngine(services, _this3.options.strategy || loadBalance.RANDOM_ENGINE),
                    hash: (0, _Util.md5)(JSON.stringify(services))
                };
            }

            return _this3.engineCache[_this3.serviceName].engine.pick();
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
                wrapper.engine.update(services);
                wrapper.hash = hash;
            } else if (!wrapper) {
                wrapper = {
                    engine: loadBalance.getEngine(services, loadBalance.RANDOM_ENGINE),
                    hash: hash
                };
            }

            this.engineCache[this.serviceName] = wrapper;
        });

        return this.watcher;
    }
}
exports.default = LoadBalanceClient;
module.exports = exports['default'];