import loadBalance from 'loadbalance';

export const RANDOM_ENGINE = 'random';

export const ROUND_ROBIN_ENGINE = 'round_robin_engine';

export const PRIORITY_ENGINE = 'priority_engine';

/**
 * Get a load balance engine.
 *
 * @param pool {*} the load balance pool.
 * @param type if you don't give a type, the default engine type is random.
 * @return {*}
 */
export function getEngine(pool, type) {
    let engine;

    switch (type) {
        case RANDOM_ENGINE:
            engine = loadBalance.random(pool);
            break;
        case ROUND_ROBIN_ENGINE:
            engine = loadBalance.roundRobin(pool);
            break;
        case PRIORITY_ENGINE:
            //TODO Not yet implemented.
            break;
        default:
            engine = loadBalance.random(pool);
    }

    return engine;
}