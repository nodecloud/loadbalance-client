import test from 'ava';

import {send} from '../src/HttpClient';

test('sending a http request.', async t => {
    const response = await send({
        url: 'http://i5sing.com/',
        method: 'GET',
        params: {
            name: 'node-cloud'
        }
    });

    if (response.statusCode === 200) {
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