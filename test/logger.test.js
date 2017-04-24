import test from 'ava';

import Logger from '../src/Logger';

test('logger with null param.', async t => {
    const logger = new Logger();
    if (logger.logger === console && logger.logger.log === console.log) {
        t.pass();
    } else {
        t.fail();
    }
});

test('logger with param without log function.', async t => {
    const logger = new Logger({});
    if (logger.logger.log === console.log) {
        t.pass();
    } else {
        t.fail();
    }
});

test('logger with param with log function.', async t => {
    const testFn = function(){};
    const logger = new Logger({log: testFn});
    if (logger.logger.log === testFn) {
        t.pass();
    } else {
        t.fail();
    }
});