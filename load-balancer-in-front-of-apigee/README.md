# Load Balance in front of Apigee

## Summary
This is an anti-pattern, custom solution and only implemented in special circumstances.  This folder shows how to configure a proxy after support has updated an existing virtual host with two new aliases, one for region1 and one for region2.  Once the virtual host is updated, then you can update your proxy as shown in the example proxy.  

This solution does not require any changes to Apigee's infrastructure and API Key validation and access token validation continue to function as before.  

## Apigee Support Implementation
This implementation requires our support team to complete the following actions.
1. Modify all existing Virtual Hosts (i.e. secure) for all organizations and environments to include a host alias for each region in which Apigee is hosted.
   * i.e. org-env-east.apigee.net, org-env-west.apigee.net
2. Register these new aliases so that they are publicly available.  
3. Notify customer of changes to Virtual Hosts.  

## Customer Implementation
There are two changes that must be made to the proxy.

1. Create new target endpoints for all regions where Apigee is deployed.  For example, if you have Apigee deployed in two regions (us-east and us-central), then create two target endpoints in your proxy - one for us-central and one for us-east.

**Target endpoint central**
```
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<TargetEndpoint name="central">
    <Description/>
    <FaultRules/>
    <PreFlow name="PreFlow">
        <Request/>
        <Response/>
    </PreFlow>
    <PostFlow name="PostFlow">
        <Request/>
        <Response/>
    </PostFlow>
    <Flows/>
    <HTTPTargetConnection>
        <Properties/>
        <LoadBalancer>
            <Server name="test-us-central"/>
        </LoadBalancer>
    </HTTPTargetConnection>
</TargetEndpoint>
```

**Target endpoint east**
```
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<TargetEndpoint name="east">
    <Description/>
    <FaultRules/>
    <PreFlow name="PreFlow">
        <Request/>
        <Response/>
    </PreFlow>
    <PostFlow name="PostFlow">
        <Request/>
        <Response/>
    </PostFlow>
    <Flows/>
    <HTTPTargetConnection>
        <Properties/>
        <LoadBalancer>
            <Server name="test-us-east"/>
        </LoadBalancer>
    </HTTPTargetConnection>
</TargetEndpoint>
```

2. Update the proxy endpoint to include the route rules to route traffic to your target endpoints based on the `system.region.name` flow variable. Note that if you don't set a default value then your request will not be routed if the region name does not exactly match.  
```
</ProxyEndpoint>
...

<RouteRule name="central">
       <TargetEndpoint>central</TargetEndpoint>
       <Condition>system.region.name == "us-central-1"</Condition>
   </RouteRule>
   <RouteRule name="east">
       <TargetEndpoint>east</TargetEndpoint>
       <Condition>system.region.name == "us-east-1"</Condition>
   </RouteRule>
</ProxyEndpoint>
```

3. Update your your load balancer to route traffic between the aliases that were provided by Apigee Support.  

## Apigee Route Rules
Take the following items into consideration.

### Default Target Endpoint
You may want to consider setting a default target endpoint, which should be the last route rule since it doesn't have a condition.  This will ensure that if the `system.region.name` that you specified does not match your condition, then requests will be routed to your backend.  

```
<RouteRule name="central">
       <TargetEndpoint>central</TargetEndpoint>
       <Condition>system.region.name == "us-central-1"</Condition>
   </RouteRule>
   <RouteRule name="east">
       <TargetEndpoint>east</TargetEndpoint>
       <Condition>system.region.name == "us-east-1"</Condition>
   </RouteRule>
</ProxyEndpoint>
<RouteRule name="default">
    <TargetEndpoint>central</TargetEndpoint>
</RouteRule>
```

### Wildcard Conditions
Consider using a wildcard condition in the event the `system.region.name` variable returns a zone or alternative name.  

```
<ProxyEndpoint>
   ....
  <RouteRule name='east'>
    <TargetEndpoint>east</TargetEndpoint>
    <Condition>system.region.name ~~ "us-east-.+"</Condition>
  </RouteRule>
  <RouteRule name='west'>
    <TargetEndpoint>west</TargetEndpoint>
    <Condition>system.region.name ~~ "us-west-.+"</Condition>
  </RouteRule>
  <RouteRule name='Default'>
    <TargetEndpoint>default</TargetEndpoint>
  </RouteRule>
</ProxyEndpoint>
```
