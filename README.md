# loadbalance-client

## Usage
```
import LoadBalanceClient from 'loadbalance-client';
import Consul from 'consul';

const SERVICE_NAME = 'a-service';

const consul = new Consul(/* ignore */);
const lbClient = new LoadBalanceClient(SERVICE_NAME, consul);

/**
 * Check the service's health status.
 */
export function checkHealth() {
    return lbClient.get({
        url: `/${SERVICE_NAME}/health`,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export function getResource(id) {
    return lbClient.get({
        url: `/${SERVICE_NAME}/v1/resources/:id`,
        params: {id: id},
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
```

## API

### new LoadBalanceClient(serviceName, consul, options)

##### serviceName

The service name.

##### consul

The consul client instance. you can see [node-consul](https://github.com/node-cloud/node-consul) for detail.

##### options

* strategy: Default is random. others are 'round_robin_engine', 'priority_engine'.
* logger: Default is console. you can use any other logger that implements logger.log function.

### lbClient.get(options)
### lbClient.post(options)
### lbClient.delete(options)
### lbClient.put(options)
### lbClient.send(options)

If you use send function, you must specific the options.method param. You can see [request](https://github.com/request/request) fro detail.