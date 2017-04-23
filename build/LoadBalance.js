'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PRIORITY_ENGINE = exports.ROUND_ROBIN_ENGINE = exports.RANDOM_ENGINE = undefined;
exports.getEngine = getEngine;

var _loadbalance = require('loadbalance');

var _loadbalance2 = _interopRequireDefault(_loadbalance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const RANDOM_ENGINE = exports.RANDOM_ENGINE = 'random';

const ROUND_ROBIN_ENGINE = exports.ROUND_ROBIN_ENGINE = 'round_robin_engine';

const PRIORITY_ENGINE = exports.PRIORITY_ENGINE = 'priority_engine';

/**
 * Get a load balance engine.
 *
 * @param pool {*} the load balance pool.
 * @param type if you don't give a type, the default engine type is random.
 * @return {*}
 */
function getEngine(pool, type) {
    let engine;

    switch (type) {
        case RANDOM_ENGINE:
            engine = _loadbalance2.default.random(pool);
            break;
        case ROUND_ROBIN_ENGINE:
            engine = _loadbalance2.default.roundRobin(pool);
            break;
        case PRIORITY_ENGINE:
            //TODO Not yet implemented.
            break;
        default:
            engine = _loadbalance2.default.random(pool);
    }

    return engine;
}