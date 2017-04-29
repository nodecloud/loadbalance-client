import test from 'ava';

import ConsulClient from 'consul';
import ServiceWatcher from '../src/ServiceWatcher';

let consul;

test.before(async t => {
    await new Promise((resolve, reject) => {
        consul = new ConsulClient({
            host: 'localhost',
            port: 8500,
        });

        const service = {
            id: 'test-service-id',
            name: 'test-service-name',
            address: 'api.github.com',
            port: 80
        };

        consul.agent.service.register(service, function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    })
});

test('watcher test', async t => {
    const watcher = new ServiceWatcher('test-service-id', consul);
    return new Promise((resolve, reject) => {
        watcher.watch();
        watcher.change(function () {
            t.pass();
            resolve();
        });
    })
});

test('end watcher test', async t => {
    const watcher = new ServiceWatcher('test-service-id', consul);
    watcher.watch();
    watcher.end();
    await new Promise((resolve, reject) => {
        watcher.change(function () {
            resolve();
        });

        consul.agent.service.deregister('test-service-id', function (err) {
            if (err) {
                throw err;
            }
        });

        setTimeout(reject, 2000);
    }).then(function () {
        t.fail();
    }).catch(function () {
        t.pass();
    });
});

test.after(t => {
    return new Promise((resolve, reject) => {
        consul.agent.service.deregister('test-service-id', function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
});