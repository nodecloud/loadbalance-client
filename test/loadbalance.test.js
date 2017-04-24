import test from 'ava';

import {getEngine} from '../src/LoadBalance';
import RandomEngine from 'loadbalance/lib/RandomEngine';
import RoundRobinEngine from 'loadbalance/lib/RoundRobinEngine';

test('get a default engine.', async t => {
    const engine = getEngine(['3', '4']);

    if (engine instanceof RandomEngine) {
        t.pass();
    } else {
        t.fail();
    }
});

test('get a random engine.', async t => {
    const engine = getEngine(['3', '4'], 'random');

    if (engine instanceof RandomEngine) {
        t.pass();
    } else {
        t.fail();
    }
});

test('get a round robin engine.', async t => {
    const engine = getEngine(['3', '4'], 'round_robin_engine');

    if (engine instanceof RoundRobinEngine) {
        t.pass();
    } else {
        t.fail();
    }
});

test('get a priority engine.', async t => {
    const engine = getEngine(['3', '4'], 'priority_engine');

    t.pass();
});