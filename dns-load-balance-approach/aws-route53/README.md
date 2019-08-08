# AWS Route53 DNS

## Summary
This example uses AWS Route53 to load balance two Nginx ingress IPs located in two different GKE regions. The Nginx ingress steps were copied from [kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress/blob/v1.5.1/docs/installation.md) the following.  

## Setup

### Manual Setup

#### 1. Create Clusters and Deploy App
Follow the steps in [GKE multi-region-setup](../gke-multiregion-setup) to setup the clusters and the sample hello world application.  

#### 2. Deploy a new service for the hello app
```
kubectl apply -f app/hello-service-nginx.yaml
kubectl apply -f app/hello-ingress-nginx.yaml
```

#### 3. Deploy Nginx as the ingress.
Create a namespace.
```
kubectl apply -f nginx/ns-and-sa.yaml
```

Create TLS certificate.
```
kubectl apply -f nginx/default-server-secret.yaml
```

Create a config map to customize nginx.
```
kubectl apply -f nginx/nginx-config.yaml
```

Configure RBAC
```
kubectl apply -f nginx/rbac.yaml
```

Deploy nginx
```
kubectl apply -f nginx/nginx-ingress.yaml
```

Check that Nginx is running.
```
kubectl get pods --namespace=nginx-ingress
```

Allow access to Nginx ingress with NodePort. Exposes port 80 on all nodes in the GKE cluster.
```
kubectl create -f nginx/nodeport.yaml
```

##### Test Deployment
Now get the IP address of a node in your cluster and send the following requests.
```
curl http://IP:31080 -H "Host: hello.example.com"

curl https://IP:31443 -H "Host: hello.example.com" -k
```

The response should be similar to what is shown below and notice that it has the `Server` header which include Nginx.  So we know that the request was handled by Nginx.  
```
* Rebuilt URL to: http://IP:31080/
< HTTP/1.1 200 OK
< Server: nginx/1.17.2
< Date: Thu, 08 Aug 2019 19:39:02 GMT
< Content-Type: text/plain; charset=utf-8
< Content-Length: 99
< Connection: keep-alive
<
Hello, world from us-central1-a!
Version: 1.0.0
Hostname: apigee-hello-deployment-6cd8dc7879-wxjxn
```


K8s will display a warning in the GCP console stating:
**Error during sync: error while evaluating the ingress spec: service "<namespace>/<masterName>" is type "ClusterIP", expected "NodePort" or "LoadBalancer**

This means that the Ingress controller should point to a NodePort or LoadBalancer, but it is only a warning and the ingress was actually created successfully.  

#### 4. Configure AWS Route53
Now you can configure AWS Route53 to use all 4 Nodes in the cluster.  

* Register a DNS entry
* Create 4 separate health checks, one for each node in the cluster (central1, central2, east1, east2).
  * enter the IP address and also add the host `hello.example.com`
  * expand advanced configuration
    * and for health checker regions, select customized and then only select the following regions.
      * US east
      * US west (N California)
      * Us west (Oregon)
* You have 4 Nodes, two in each K8S cluster in GCP with public IP addresses. Create 4 new record sets (A records) to the hosted zone.  
  * Routing policy: weighted and assign all IPs the same weight (i.e. 1)
  * TTL: 1 minute
  * Associate with a health check: yes and assign the corresponding health check you created earlier.
* Create a GCP firewall rule to allow health check requests from AWS.
  * After you create the health check, you can select it and then click `Health Checkers` tab to find the IP addresses that need to be included in GCP firewall.
  * Be sure to include the ports (31080 and 31443) in the firewall.


### Testing

#### 1. Send a request with the domain name you registered
```
curl http://DOMAIN_NAME:31080 -H "Host: hello.example.com"
```

You should get a response similar to the one below. Depending on that response scale the cluster to zero for the region that you received in the response. So if you received a response from the east cluster then scale that to zero.  
```
GET / HTTP/1.1
> Host: hello.example.com
> User-Agent: curl/7.54.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.17.2
< Date: Thu, 08 Aug 2019 20:52:47 GMT
< Content-Type: text/plain; charset=utf-8
< Content-Length: 96
< Connection: keep-alive
<
Hello, world from us-east1-b!
Version: 1.0.0
Hostname: apigee-hello-deployment-647ff58ffb-7wfdt
```

#### 2. Scale the GKE cluster to zero
Get the cluster credentials. Execute one of the commands below.
```
gcloud container clusters get-credentials gke-cluster-uscentral --zone us-central1-a
gcloud container clusters get-credentials gke-cluster-useast --zone us-east1-b
```

Scale the deployment to zero
```
kubectl scale deployment apigee-hello-deployment --replicas=0
```

After about a minute and thirty seconds, you should see the health checks fail.

Then send the request again and you should see the response from the other region.
```
curl http://DOMAIN_NAME:31080 -H "Host: hello.example.com"
```

You should eventually see a response similar to the one below; it depends on how you configured your health check (default is health check request sent every 30 seconds and 3 failed requests). You will see a 502 Bad Gateway from Nginx during the time it takes for Route53 to fail over to an alternate IP address.  

```
GET / HTTP/1.1
> Host: hello.example.com
> User-Agent: curl/7.54.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.17.2
< Date: Thu, 08 Aug 2019 21:11:02 GMT
< Content-Type: text/plain; charset=utf-8
< Content-Length: 99
< Connection: keep-alive
<
Hello, world from us-central1-a!
Version: 1.0.0
Hostname: apigee-hello-deployment-6cd8dc7879-mvq58
```


Now scale the cluster back up to 2 instances again.

```
kubectl scale deployment apigee-hello-deployment --replicas=2
```

You will see the health check succeeds again.  You should also see responses from all servers.  You may have to wait a few minutes between each request to see the responses from both regions.  
