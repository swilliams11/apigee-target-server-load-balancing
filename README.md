# apigee-target-server-load-balancing

## Summary
I created this repository to demonstrate alternatives to the Apigee load balancer, based on a customer's feature request to enhance the [Apigee target server load balancer](https://docs.apigee.com/api-platform/deploy/load-balancing-across-backend-servers) according to industry standards. This particular customer's backend servers were hosted in Google's Cloud Platform, specifically using Google Kubernetes Engine running in multiple clusters across multiple regions, which is why this repo uses GCP products to demonstrate how to load balance Kubernetes clusters.  Apigee's current load balancing behavior is described in the next section. Most of our clients load balance outside of Apigee or accept Apigee's default load balancing behavior. If they load balance outside of Apigee then they place a load balancer in front of their target services and provide Apigee with a single domain name.  

This repository includes some alternatives to the Apigee load balancer.  
* ANTI-PATTERN - Use a policy based approach to load balance within Apigee Edge.
  *  apigee-proxy-load-balancer-approach - TODO
  This approach uses a policy based load balancing approach, meaning that you use Apigee policies and custom JavaScript policies to implement the load balancing failover and failback in Edge.  This should only be used as an absolute last resort.

* ANTI-PATTERN: Use a load balancer in front of Apigee Edge, which load balances between across Apigee regions.
  This is an anti-pattern and a custom solution and it requires help from our support team.  We only implement this in special circumstances.  Since a third-party application is load balancing across regions, then a customer is relying on that load balancer in front of Apigee to failover across regions as opposed to relying on the Apigee infrastructure.

### GCP Load Balancing Options
There are severals GCP load balancers, but I'll demonstrate 3 to load balance across GKE clusters.
* HTTPS load balancer with [multi-cluster ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress)
* [Container native load balancing](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing) with the HTTPS load balancer
* [Traffic Director](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)


## Apigee Target Server Load balancer Behavior
The Apigee load balancer uses a network level check (TCP) to determine if it can make a connection to the target endpoint. If the load balancer cannot establish a connection, then it automatically retries the request the next server.  This is the default behavior and it never removes a target server from the rotation.  When you use the load balancer, you should always configure a health monitor and this is considered a best practice.

If you want to ensure that the load balancer removes a target server from rotation, then configure either a TCP health monitor or an HTTP health monitor and also set the MaxFailures count to be greater than zero.  This is where the load balancer behavior gets interesting.  Assume that you have a load balancer configured with an HTTP health check and MaxFailures set to 5.  Also assume that the target server is down, meaning that it returns 5XX errors consistently.  Apigee's load balancer will attempt to establish a connection to the target server and it will succeed, so it RESETS the MaxFailure counter, but the HTTP monitor will send a health check request and fail, so it INCREASES the MaxFailure counter.  This is the fundamental issue between the load balancer and the health check.  

There is one surprise, this is the expected behavior and was designed this way.  Apigee has a feature request to change the behavior on the load balancer so that it align with industry standards (i.e. Envoy).

## Load Balancing Approaches
### ANTI-PATTERNS
#### Policy Based Approach to Load Balancing in Apigee Edge
This is an anti-pattern and is described here as such.

#### Load Balancer in front of Apigee Regions
This is an anti-pattern and is only implemented only under very limited circumstances.  

This can be achieved if you have Apigee deployed in multiple regions and you have a robust load balancer.  I've seen this implemented with Akamai as the load balancer for several Apigee regions.  It requires our support team to update your virtual host with new aliases and register those aliases so they are publicly available.  Now you can take those DNS entries and include them in your load balancer.  This implementation does not require any changes to the Apigee infrastructure; your Cassandra cluster is still in take and API key validation and access token validation continues to work.

### Google Cloud Platform Options
The most common approach to load balancing backends is to use a robust load balancer (GCP LBs, Akamai, F5, Nginx, etc.) "behind" Apigee and provide Apigee a single target endpoint.  There are multiple load balancers available in GCP to load balance across GKE clusters.  The options below are for GCP customers that use GKE.

#### HTTPS load balancer with [multi-cluster ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress)

#### [Container native load balancing](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing) with the HTTPS load balancer

#### [Traffic Director](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)