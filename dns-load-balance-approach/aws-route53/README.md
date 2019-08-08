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

Allow access to Nginx ingress with NodePort.
```
kubectl create -f nginx/nodeport.yaml
```

Now get the IP address of a node in your cluster and send the following requests.
```
curl http://IP:31080

curl https://IP:31443 -k
```

K8s will display a warning in the GCP console stating:
**Error during sync: error while evaluating the ingress spec: service "<namespace>/<masterName>" is type "ClusterIP", expected "NodePort" or "LoadBalancer**

This means that the Ingress controller should point to a NodePort or LoadBalancer, but it is only a warning and the ingress was actually created successfully.  

#### 4. Configure AWS Route53

* Register a DNS entry
* You have 4 Nodes, two in each K8S cluster in GCP with public IP addresses. Create 4 new record sets (A records) to the hosted zone.  
  * Routing policy: weighted and assign all IPs the same weight
  * Associate with a health check: yes (you will create this next)
