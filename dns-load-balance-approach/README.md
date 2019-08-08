# DNS Based Load Balancing Approach

## Summary
In the event a customer is not able to use any of the GCP products listed in this repository, then another load balancing alternative is to use DNS with health checks on the IP addresses. If you have multiple ingress IPs for your service located in multiple GKE regions, then you can configure your DNS to load balance the traffic and to remove IPs if the health check does not respond accordingly.  This directory demonstrates some DNS load balancing approaches.  

### DNS Load Balancing approaches

### AWS Route53
This example use AWS Route53 to load balance services deployed to two regions with public IPs assigned to the Nginx ingress.  
