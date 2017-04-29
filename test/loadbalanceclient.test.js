import test from 'ava';
import ConsulClient from 'consul';

import LoadBalanceClient from '../src/LoadBalanceClient';

let consul;
let lbClient, lbClient2;

test.before(async t => {
    await new Promise((resolve, reject) => {
        consul = new ConsulClient({
            host: 'localhost',
            port: 8500,
        });
        resolve();
    });

    await new Promise((resolve, reject) => {
        const service = {
            id: 'test-service-id-2',
            name: 'test-service-name-2',
            address: 'api.github.com',
            port: 80
        };

        consul.agent.service.register(service, function (err) {
            if (err) {
                return reject(err);
            }

            lbClient = new LoadBalanceClient('test-service-name-2', consul, {
                request: {
                    test: {}
                }
            });
            resolve();
        });
    });

    return new Promise((resolve, reject) => {
        const serviceB = {
            id: 'test-service-id-3',
            name: 'test-service-name-3',
            address: 'localhost',
            port: 8080
        };

        consul.agent.service.register(serviceB, function (err) {
            if (err) {
                return reject(err);
            }

            lbClient2 = new LoadBalanceClient('test-service-name-3', consul);
            resolve();
        });
    })
});

test('use send method sending a request without options.', async t => {
    try {
        await lbClient.send();
    } catch (e) {
        if (e.message === 'No options was given, please give an options before send api request.') {
            t.pass();
        } else {
            t.fail();
        }
    }
});

test('use send method sending a request.', async t => {
    const response = await lbClient.send({
        scheme: 'https',
        url: '/orgs/:org',
        method: 'GET',
        params: {
            org: 'node-cloud'
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'
        }
    });

    if (response.statusCode === 200 && 'https://api.github.com/orgs/node-cloud' === response.request.href) {
        t.pass();
    } else {
        t.fail();
    }
});

test('use get method sending a request.', async t => {
    const response = await lbClient.get({
        scheme: 'https',
        url: '/orgs/:org',
        params: {
            org: 'node-cloud'
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'
        }
    });

    if (response.statusCode === 200 && 'https://api.github.com/orgs/node-cloud' === response.request.href) {
        t.pass();
    } else {
        t.fail();
    }
});

test('test listen refreshing-services event', async t => {
    return new Promise(resolve => {
        lbClient.on('refreshing-services', function () {
            resolve();
            t.pass();
        });
    });
});

test('test off listen refreshing-services event', async t => {
    lbClient.off('refreshing-services', refreshingServicesListener);
    t.pass();
});

test('test send method when the port is not 80.', async t => {
    try {
        await lbClient2.get({
            url: '/tests'
        });
    } catch (e) {
        if (e.message === 'Error: connect ECONNREFUSED 127.0.0.1:8080') {
            t.pass();
        } else {
            t.fail();
        }
    }
});

test('test send method when no available service.', async t => {
    const noServiceClient = new LoadBalanceClient('unavailable-service', consul);

    try {
        await noServiceClient.get({
            url: '/tests'
        });
    } catch (e) {
        console.log(e.message.indexOf('No service'));
        if (e.message.indexOf('No service') !== -1) {
            t.pass();
        } else {
            t.fail();
        }
    }
});

test.after(async t => {
    await new Promise((resolve, reject) => {
        consul.agent.service.deregister('test-service-id-2', function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });

    return new Promise((resolve, reject) => {
        consul.agent.service.deregister('test-service-id-3', function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
});

function refreshingServicesListener() {
}