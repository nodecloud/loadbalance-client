import _ from 'lodash';

import {md5} from './Util';

import * as http from './HttpClient';
import * as loadBalance from './LoadBalance';
import ServiceWatcher from './ServiceWatcher';
import RefreshingEvent from './RefreshingEvent';

const REFRESHING_SERVICE_LIST_EVENT = 'refreshing-services';
const REFRESHING_SERVICE_LIST_ERROR_EVENT = 'refreshing-services-error';

/**
 * An http client with load balance.
 */
export default class LoadBalanceClient {
    constructor(serviceName, consul, options = {}) {
        this.options = options = options || {};
        this.requestOptions = options.request || {};
        this.serviceName = serviceName;
        this.consul = consul;
        this.engineCache = {};
        this.watcher = new ServiceWatcher(serviceName, consul, options);
        this.initWatcher();
        this.event = new RefreshingEvent();

        this.preSend = () => {
        };
        this.postSend = () => {
        };
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

    async getRequestOptions(service, options) {
        if (!options) {
            throw new Error(`No options was given, please give an options before send api request.`);
        }

        for (let key in this.requestOptions) {
            if (!this.requestOptions.hasOwnProperty(key) || options[key]) {
                continue;
            }

            options[key] = this.requestOptions[key];
        }
        const address = await this.getAddress(service);

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
    }

    async upload(options) {
        const service = await this.getService();
        const request = await this.getRequestOptions(service, options);
        const newRequest = this.preSend(request);
        const requestObj = {...request, ...newRequest};
        try {
            const stream = http.upload(requestObj);
            this.postSend(null, stream, requestObj);
            return stream;
        } catch (e) {
            this.postSend(e);
            if (!e.response) {
                this.removeUnavailableNode(`${service.Service.Address}:${service.Service.Port}`);
            }
            throw e;
        }
    }

    async send(options) {
        const service = await this.getService();
        const request = await this.getRequestOptions(service, options);
        const newRequest = this.preSend(request);
        const requestObj = {...request, ...newRequest};

        try {
            const response = await http.send(requestObj);
            this.postSend(null, response, requestObj);
            return response;
        } catch (e) {
            this.postSend(e);
            if (!e.response) {
                this.removeUnavailableNode(`${service.Service.Address}:${service.Service.Port}`);
            }
            throw e;
        }
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
                hash: md5(JSON.stringify(filterdServices))
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
    async getAddress(service) {
        if (!service) {
            throw new Error(`No service '${this.serviceName}' was found.`);
        }

        if (service.Service.Port === 80 || !service.Service.Address) {
            return service.Service.Address;
        }

        return `${service.Service.Address}:${service.Service.Port}`;
    }

    /**
     * Get a available service by load balance.
     * @return {Promise.<void>}
     */
    async getService() {
        if (!this.engineCache[this.serviceName]) {
            let options = this.options;
            options.service = this.serviceName;
            if (!_.has(options, 'passing')) {
                options.passing = true;
            }

            const services = await new Promise((resolve, reject) => {
                this.consul.health.service(options, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(result);
                });
            });

            const wrapper = {
                pool: services,
                engine: loadBalance.getEngine(services, this.options.strategy || loadBalance.RANDOM_ENGINE),
                hash: md5(JSON.stringify(services))
            };

            this.engineCache[this.serviceName] = wrapper;

            this.event.emit(REFRESHING_SERVICE_LIST_EVENT, services, wrapper.engine._pool);
        }

        return this.engineCache[this.serviceName].engine.pick();
    }

    /**
     * Init consul services change listener.
     */
    initWatcher() {
        this.watcher.watch();
        this.watcher.change(services => {
            let wrapper = this.engineCache[this.serviceName];
            let hash = md5(JSON.stringify(services));
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
