'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Util = require('./Util');

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

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
        this.serviceName = serviceName;
        this.consul = consul;
        this.engineCache = {};
        this.watcher = new _ServiceWatcher2.default(serviceName, consul);
        this.initWatcher();
        this.logger = new _Logger2.default(options.logger);
    }

    send(options) {
        var _this = this;

        return _asyncToGenerator(function* () {
            if (!options) {
                throw new Error(`No options was given, please give an options before send api request.`);
            }
            const endpoint = yield _this.getEndpoint();

            options.url = endpoint + options.url;
            options.logger = _this.logger;

            return http.send(options);
        })();
    }

    get(options = {}) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            options.method = 'GET';
            return _this2.send(options);
        })();
    }

    post(options = {}) {
        var _this3 = this;

        return _asyncToGenerator(function* () {
            options.method = 'POST';
            return _this3.send(options);
        })();
    }

    del(options = {}) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
            options.method = 'DELETE';
            return _this4.send(options);
        })();
    }

    put(options = {}) {
        var _this5 = this;

        return _asyncToGenerator(function* () {
            options.method = 'PUT';
            return _this5.send(options);
        })();
    }

    /**
     * Get a http endpoint.
     * @return {Promise.<string>}
     */
    getEndpoint() {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            let service = null;
            try {
                service = yield _this6.getService();
            } catch (e) {
                _this6.logger.error('Get consul service error.', e);
            }

            if (!service) {
                _this6.logger.error(`No service '${_this6.serviceName}' was found.`);
                throw new Error(`No service '${_this6.serviceName}' was found.`);
            }

            return `http://${service.Service.Address}:${service.Service.Port}`;
        })();
    }

    /**
     * Get a available service by load balance.
     * @return {Promise.<void>}
     */
    getService() {
        var _this7 = this;

        return _asyncToGenerator(function* () {
            if (!_this7.engineCache[_this7.serviceName]) {
                const services = yield new Promise(function (resolve, reject) {
                    _this7.consul.health.service(_this7.serviceName, function (err, result) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(result);
                    });
                });

                _this7.logger.info(`Refresh the '${_this7.serviceName}' service list, the list is ${JSON.stringify(services)}`);
                _this7.engineCache[_this7.serviceName] = {
                    engine: loadBalance.getEngine(services, _this7.options.strategy || loadBalance.RANDOM_ENGINE),
                    hash: (0, _Util.md5)(JSON.stringify(services))
                };
            }

            return _this7.engineCache[_this7.serviceName].engine.pick();
        })();
    }

    /**
     * Init consul services change listener.
     */
    initWatcher() {
        this.watcher.watch();
        this.watcher.change(services => {
            this.logger.info(`Refresh the '${this.serviceName}' service list, the list is ${JSON.stringify(services)}`);
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
        this.watcher.error(err => {
            this.logger.error(`Check the service '${this.serviceName}''s health error`, err);
        });
    }
}
exports.default = LoadBalanceClient;
module.exports = exports['default'];