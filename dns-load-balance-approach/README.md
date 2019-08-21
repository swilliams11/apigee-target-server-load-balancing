# DNS Based Load Balancing Approaches

## Summary
In the event a customer is not able to use any of the GCP products listed in this repository, then another load balancing alternative is to use DNS with health checks on the IP addresses. If you have multiple ingress IPs for your service located in multiple GKE regions, then you can configure your DNS to load balance the traffic and to remove IPs if the health check does not respond accordingly.  This directory demonstrates some DNS load balancing approaches.  

### DNS Load Balancing approaches

#### GCP DNS Load Balancer
This [example](gcp-dns) was my first attempt for a Node.js health check application that will send health check requests to a single server.  If the health check failed then it would remove the IP address (A record) from Google DNS.  
TODO - allow health check requests to multiple servers.  

#### GCP DNS Load Balancer with GCP products
This approach uses the products below to accomplish the same task as above (update the GCloud DNS A record set to remove or add back the down IP).
* Stackdriver (alerts and polices)
* GCP Pub/Sub
* GCP Cloud Functions

I followed the documentation listed in [Second-Party Triggers with Stackdriver](https://cloud.google.com/functions/docs/calling/logging) to configure all the components.  

The cloud function is listed in this directory.  

#### AWS Route53
This example use [AWS Route53](aws-route53) to load balance services deployed to two regions with public IPs assigned to the Nginx ingress.  
