# loadbalance-client

## Usage
``` javascript
import LoadBalanceClient from 'loadbalance-client';
import Consul from 'consul';

const SERVICE_NAME = 'a-service';

const consul = new Consul(/* ignore */);
const lbClient = new LoadBalanceClient(SERVICE_NAME, consul);

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

#### serviceName

The service name.

#### consul

The consul client instance. you can see [node-consul](https://github.com/node-cloud/node-consul) for detail.

#### options

* strategy: Default is random. Others are 'round_robin_engine', 'priority_engine'.
* request: You can see [request](https://github.com/request/request) for detail.
* Other options you can see [node-consul](https://github.com/node-cloud/node-consul) for detail.

### lbClient.get(options)
### lbClient.post(options)
### lbClient.delete(options)
### lbClient.put(options)
### lbClient.send(options)

If you use send function, you must specific the options.method param. 
You can see [request](https://github.com/request/request) for detail.
This options have a higher priority than global options.

### lbClient.onPreSend(callback: request)
### lbClient.onPostSend(callback: response)

## Event
support events:

* refreshing-services


lbClient.on(eventName, callback);

lbClient.off(eventName, callback);
