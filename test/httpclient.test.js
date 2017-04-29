import test from 'ava';

import {send} from '../src/HttpClient';

test('sending a http request.', async t => {
    const response = await send({
        url: 'https://api.github.com/orgs/:org',
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

test('sending a wrong http request.', async t => {
    try {
        const response = await send({
            url: 'http://localhost:9999/',
            method: 'GET'
        });

        t.fail();
    } catch (e) {
        t.pass();
    }
});