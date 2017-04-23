import Logger from './Logger';
import * as http from './HttpClient';
import * as loadBalance from './LoadBalance';
import * as engineCache from './EngineCache';
import ServiceWatcher from './ServiceWatcher';

/**
 * An http client with load balance.
 */
export default class LoadBalanceClient {
    constructor(serviceName, consul, options = {}) {
        this.serviceName = serviceName;
        this.consul = consul;
        this.watcher = new ServiceWatcher(serviceName, consul);
        this.initWatcher();
        this.logger = new Logger(options.logger);
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
            engineCache.set(this.serviceName, loadBalance.getEngine(services, loadBalance.RANDOM_ENGINE));
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