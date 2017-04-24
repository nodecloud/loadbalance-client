import test from 'ava';

import {md5} from '../src/Util';

test('md5 test', async t => {
    const md5Str = md5('admin');
    
    if (md5Str === '21232f297a57a5a743894a0e4a801fc3') {
        t.pass();
    } else {
        t.fail();
    }
});