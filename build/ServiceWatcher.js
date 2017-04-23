'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Service watcher.
 */
class ServiceWatcher {
    constructor(serviceName, consul) {
        this.serviceName = serviceName;
        this.consul = consul;
    }

    /**
     * Start watch.
     *
     * @param serviceName
     */
    watch(serviceName) {
        this.watcher = this.consul.watch(this.consul.health.service, {
            service: serviceName || this.serviceName,
            passing: true
        });

        this.watcher.on('change', (data, res) => {
            this.change(data, res);
        });

        this.watcher.on('error', err => {
            this.error(err);
        });
    }

    /**
     * Change callback.
     *
     * @param callback the parameter is (data, res).
     */
    change(callback) {
        if (callback && typeof callback === 'function') {
            this.watcher.on('change', callback);
        }
    }

    /**
     * Error callback.
     *
     * @param callback The callback parameter is (error).
     */
    error(callback) {
        if (callback && typeof callback === 'function') {
            this.watcher.on('error', callback);
        }
    }

    end() {
        this.watcher.end();
    }
}
exports.default = ServiceWatcher;