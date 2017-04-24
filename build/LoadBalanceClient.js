'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _HttpClient = require('./HttpClient');

var http = _interopRequireWildcard(_HttpClient);

var _LoadBalance = require('./LoadBalance');

var loadBalance = _interopRequireWildcard(_LoadBalance);

var _EngineCache = require('./EngineCache');

var engineCache = _interopRequireWildcard(_EngineCache);

var _ServiceWatcher = require('./ServiceWatcher');

var _ServiceWatcher2 = _interopRequireDefault(_ServiceWatcher);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An http client with load balance.
 */
class LoadBalanceClient {
    constructor(serviceName, consul, options = {}) {
        this.options = options = options || {};
        this.serviceName = serviceName;
        this.consul = consul;
        this.watcher = new _ServiceWatcher2.default(serviceName, consul);
        this.initWatcher();
        this.logger = new _Logger2.default(options.logger);
    }

    async send(options) {
        if (!options) {
            throw new Error(`No options was given, please give an options before send api request.`);
        }
        const endpoint = await this.getEndpoint();

        options.url = endpoint + options.url;
        options.logger = this.logger;

        return http.send(options);
    }

    async get(options = {}) {
        options.method = 'GET';
        return this.send(options);
    }

    async post(options = {}) {
        options.method = 'POST';
        return this.send(options);
    }

    async del(options = {}) {
        options.method = 'DELETE';
        return this.send(options);
    }

    async put(options = {}) {
        options.method = 'PUT';
        return this.send(options);
    }

    /**
     * Get a http endpoint.
     * @return {Promise.<string>}
     */
    async getEndpoint() {
        let service = null;
        try {
            service = await this.getService();
        } catch (e) {
            this.logger.error('Get consul service error.', e);
        }

        if (!service) {
            this.logger.error(`No service '${this.serviceName}' was found.`);
            throw new Error(`No service '${this.serviceName}' was found.`);
        }

        return `http://${service.Service.Address}:${service.Service.Port}`;
    }

    /**
     * Get a available service by load balance.
     * @return {Promise.<void>}
     */
    async getService() {
        if (!engineCache.get(this.serviceName)) {
            const services = await new Promise((resolve, reject) => {
                this.consul.health.service(this.serviceName, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(result);
                });
            });

            this.logger.info(`Refresh the '${this.serviceName}' service list, the list is ${JSON.stringify(services)}`);
            engineCache.set(this.serviceName, loadBalance.getEngine(services, this.options.strategy || loadBalance.RANDOM_ENGINE));
        }

        return engineCache.get(this.serviceName).pick();
    }

    /**
     * Init consul services change listener.
     */
    initWatcher() {
        this.watcher.watch();
        this.watcher.change(services => {
            this.logger.info(`Refresh the '${this.serviceName}' service list, the list is ${JSON.stringify(services)}`);
            let engine = engineCache.get(this.serviceName);
            if (engine) {
                engine.update(services);
            } else {
                engine = loadBalance.getEngine(services, loadBalance.RANDOM_ENGINE);
            }

            engineCache.set(this.serviceName, engine);
        });
        this.watcher.error(err => {
            this.logger.error(`Check the service '${this.serviceName}''s health error`, err);
        });
    }
}
exports.default = LoadBalanceClient;
module.exports = exports['default'];