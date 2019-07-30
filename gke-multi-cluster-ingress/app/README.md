# app

## Summary
This folder contains the following files:
* hello-ingress-mci.yaml - This is the global HTTPS load balancer, which assigns a single IP address for all regions.  
* hello-service-mci.yaml - This is the service with Nodeport set to allow internal load balancing across multiple pods within a region.

## Prerequisites
This assumes that you have already deployed the [backend application](../../gke-multiregion-setup/app) and you have setup the multi-cluster-ingress as shown [here](..).

## Deploy the multi-cluster-ingress and service
1. Deploy the service.
```
kubectl apply -f hello-service-mci.yaml
```

2. Deploy the multi-cluster-ingress.
```
./kubemci create mci-ingress --ingress=hello-ingress-mci.yaml --kubeconfig=mcikubeconfig
```

## Delete the multi-cluster-ingress
```
./kubemci delete mci-ingress     --ingress=hello-ingress-mci.yaml     --kubeconfig=mcikubeconfig
```

## Delete the service
```
kubectl delete service apigee-hello-service-mci
```
