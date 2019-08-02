# apigee-target-server-load-balancing

## Summary
I created this repository to demonstrate alternatives to the Apigee load balancer, based on a customer's feature request to enhance the [Apigee target server load balancer](https://docs.apigee.com/api-platform/deploy/load-balancing-across-backend-servers) according to industry standards. This particular customer's backend servers were hosted in Google's Cloud Platform, specifically using Google Kubernetes Engine running in multiple clusters across multiple regions, which is why this repo uses GCP products to demonstrate how to load balance Kubernetes clusters.  Apigee's current load balancing behavior is described in the [Apigee Target Server Load balancer Behavior](#apigee-target-server-load-balancer-behavior) section. Most of our clients load balance outside of Apigee or accept Apigee's default load balancing behavior. If they load balance outside of Apigee then they place a load balancer in front of their target services and provide Apigee with a single domain name.  

This repository includes alternatives to the Apigee load balancer.  

### Apigee Load balancing options - Anti-patterns
I documented two anti-patterns, alternatives to the Apigee load balancer.  
1. ANTI-PATTERN: Use a policy based approach to load balance within Apigee Edge.
  *  apigee-proxy-load-balancer-approach - TODO
  This approach uses a policy based load balancing approach, meaning that you use Apigee policies and custom JavaScript policies to implement the load balancing failover and failback in Edge.  This should only be used as an absolute last resort.

2. ANTI-PATTERN: Use a load balancer in front of Apigee Edge, which load balances across Apigee regions.
  This is an anti-pattern and it is also a custom solution that requires help from our support team.  We only implement this in **special circumstances**.  If you use a third-party application to load balance traffic across regions, then you are relying on that load balancer in front of Apigee to failover across regions as opposed to relying on the Apigee infrastructure for cross-region failover.  Apigee cannot provide a 99.99% SLA in this case because you are not relying on Apigee infrastructure to perform cross-region failover.  It is as if you are using Apigee within a single region, which has a 99.9% SLA.
  * A sample proxy with route rules and two target endpoints is shown in the  [load-balancer-in-front-of-apigee](load-balancer-in-front-of-apigee) folder.

### Google Cloud Platform Load Balancing Options
There are severals GCP load balancers, but I'll demonstrate 3 to load balance across GKE clusters.
* HTTPS load balancer with [multi-cluster ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress)
* [Container native load balancing](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing) with the HTTPS load balancer
* [Traffic Director](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)


## Apigee Target Server Load balancer Behavior
The Apigee load balancer uses a network level check (TCP) to determine if it can make a connection to the target endpoint. If the load balancer cannot establish a connection, then it automatically retries the request the next server.  This is the default behavior and it never removes a target server from the rotation.  When you use the load balancer, you should always configure a health monitor and this is considered a best practice.

If you want to ensure that the load balancer removes a target server from rotation, then configure either a TCP health monitor or an HTTP health monitor and also set the MaxFailures count to be greater than zero.  This is where the load balancer behavior gets interesting.  Assume that you have a load balancer configured with an HTTP health check and MaxFailures set to 5.  Also assume that the target server is down, meaning that it returns 5XX errors consistently.  Apigee's load balancer will attempt to establish a connection to the target server and it will succeed, so it RESETS the MaxFailure counter, but the HTTP monitor will send a health check request and fail, so it INCREASES the MaxFailure counter.  This is the fundamental issue between the load balancer and the health check and it causes some unexpected behavior under load and delays when a server should be removed from rotation.  

There is one surprise, however. This is the expected behavior and was designed this way.  Apigee has a feature request to change the behavior on the load balancer so that it align with industry standards (i.e. Envoy).

## Load Balancing Approaches
### Apigee ANTI-PATTERNS
#### Policy Based Approach to Load Balancing in Apigee Edge
This is an anti-pattern and is described here as such.
TODO - Provide an example

#### Load Balancer in front of Apigee Regions
**This is an anti-pattern and is only implemented only under very limited circumstances.**

This can be achieved if you have Apigee deployed in multiple regions and you have a robust load balancer.  I've seen this implemented with Akamai as the load balancer for several Apigee regions.  It requires our support team to update your virtual host with new aliases and register those aliases so they are publicly available.  Now you can take those DNS entries and include them in your load balancer.  This implementation does not require any changes to the Apigee infrastructure; your Cassandra cluster is still a cluster across multiple regions and API key validation and access token validation continues to work as before.

### Google Cloud Platform Options
The most common approach to load balancing backends is to use a robust load balancer (GCP LBs, Akamai, F5, Nginx, etc.) "behind" Apigee and provide Apigee a single target endpoint.  There are multiple load balancers available in GCP to load balance across GKE clusters.  The options below are for GCP customers that use GKE.

#### HTTPS load balancer with [multi-cluster ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress)
* [mult-cluster-ingress example](gke-multi-cluster-ingress)
* This is the only option where I was able to load balance external traffic across multiple GKE clusters in two regions.

#### [Container native load balancing](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing) with the HTTPS load balancer
* [Container native load balancing example](container-native-load-balancing)
* I tried this option in this folder, but it does not load balance traffic across regions.  Review the README for more details.

#### [Traffic Director](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)
* [Traffic Directory example](traffic-director)
* I tried this option in this folder, but it has some limitations with respect to external traffic. Our current docs state that it can only be used to connect services running in GCP.  
* I considered using a Global Load balancer to allow external traffic to services deployed in GCP K8S, but it suffers from the same problem in the **Container Native Load Balancing** example.  At this time, it doesn't appear that this approach will load balance public traffic across GKE clusters in multiple regions.  However, it does direct internal traffic across GKE clusters in multiple regions.  

## GKE Multiregion Setup
Follow the [gke-multregion-setup](gke-multiregion-setup) to configure a GKE cluster across multiple regions for testing. This will setup two GKE clusters in us-central and us-east with a sample Go app deployed to both regions. Two services will be deployed with two separate IP addresses.  Those two IP addresses can be used in Apigee Edge as target servers.  

## Multi-cluster-ingress Setup
Follow the [gke-multi-cluster-ingress](gke-multi-cluster-ingress) README to configure a multi-cluster-ingress for GKE clusters across multiple regions. This demo requires that you complete the GKE Multiregion Setup above.
