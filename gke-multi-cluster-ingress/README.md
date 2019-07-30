# GKE multi-cluster-ingress

## Summary
This repository demonstrates GKE's [multi-cluster-ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress).
This provides a simple way to configure an HTTPS load balancer across two GKE clusters and provides a single IP address for the load balancer.  Users in the us-east region will gain access to the us-east GKE cluster and likewise for clients located in the us-central region.

The multi-cluster-ingress configures an HTTPS load balancer with default settings
* Interval 60 seconds
* Timeout 60 sec
* Unhealthy threshold: 10 failures
* Healthy threshold 1 success

We can change these settings manually, but any updates to the mult-cluster-ingress via the command line reset your values to the original values shown above.  Furthermore, the ingress controller (yaml) does not expose the ability to set the health check at this time.  

## Prerequisites
You must have already created the GKE cluster and deployed the app to both regions. Complete the steps in [gke-multiregion-setup](../gke-multiregion-setup#deploy-clusters-with-script).

## Multi-cluster-ingress Links
https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress
https://kubernetes.io/docs/concepts/services-networking/ingress/

## Setup
### Automated Setup
#### Install kubemci

##### LINUX - use this from cloud shell
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/linux/amd64/kubemci
```

##### MAC
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/darwin/amd64/kubemci
```

##### Make the downloaded file executable.
```
chmod +x ./kubemci
```

Install in `usr/bin` which will make it executable anywhere on the command line.
```
cp kubemci /usr/local/bin
```

#### Deploy new service, and mci
```
./deploy-all.sh
```

#### Get the status of the multi-cluster-ingress
1. mci status
Execute one of the following below depending on where you want to check the status of the mci.  
```
gcloud container clusters get-credentials gke-cluster-central --zone us-central1-a
gcloud container clusters get-credentials gke-cluster-east --zone us-east1-b
```

List all mci's for a particular project
```
kubemci list --gcp-project=$(gcloud config get-value project)
```

Get the status of a specific mci.  
```
kubemci get-status mci-ingress --gcp-project=$(gcloud config get-value project)
```

### Manual Setup
Complete all the steps below.
#### Firewall
You must configure a firewall rule to allow the following ranges for the GCP health checks to succeed.  
`130.211.0.0/22` and `35.191.0.0/16`.

```
gcloud compute firewall-rules create fw-allow-health-checks \
    --network default \
    --action ALLOW \
    --direction INGRESS \
    --source-ranges 35.191.0.0/16,130.211.0.0/22 \
    --target-tags allow-health-checks \
    --rules tcp
```

#### Install kubemci

##### LINUX - use this from cloud shell
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/linux/amd64/kubemci
```

##### MAC
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/darwin/amd64/kubemci
```

##### Make the downloaded file executable.
```
chmod +x ./kubemci
```

Install in `usr/bin` which will make it executable anywhere on the command line.
```
cp kubemci /usr/bin
```

#### Setup KUBECONFIG
```
export GCP_PROJECT=$(gcloud config get-value project)
KUBECONFIG=~/mcikubeconfig gcloud container clusters get-credentials --zone=us-central1-a gke-cluster-uscentral
KUBECONFIG=~/mcikubeconfig gcloud container clusters get-credentials --zone=us-east1-b gke-cluster-useast
```

#### Deploy the service  
```
gcloud container clusters get-credentials gke-cluster-central --zone us-central1-a
kubectl create -f app

gcloud container clusters get-credentials gke-cluster-east --zone us-east1-b
kubectl create -f app
```

#### Reserve static IP address
```
gcloud compute addresses create --global global-lb-mci-ip
```

#### Deploy the multi-cluster-ingress
```
kubemci create mci-ingress --ingress=hello-ingress-mci.yaml --kubeconfig=mcikubeconfig
```

#### Get the status of the multi-cluster-ingress
```
./kubemci get-status mci-ingress --gcp-project=$GCP_PROJECT
```

#### Update the Load Balancer Healthcheck

Change the health check so that it is more responsive.  
```
gcloud compute health-checks update http mci1-hc-30061--mci-ingress \
    --description='Health check for service {"kubernetes.io/service-name":"default/apigee-hello-ingress","kubernetes.io/service-port":"80"} as part of kubernetes multicluster loadbalancer mci-ingress' \
    --check-interval=2s \
    --timeout=2s \
    --healthy-threshold=5 \
    --unhealthy-threshold=5
```



## DEMO
**Prereqs**
Update the mci load balancer as shown above.  


Show that your browser is hitting the central region cluster.
http://IP

Start load tester from your local terminal, which sends all requests to us-central
```
loadtest -n 500 -c 1 --rps 1 http://IP
```

Switch to GKE central context
```
gcloud container clusters get-credentials gke-cluster-central --zone us-central1-a
```

Scale central cluster to zero
```
kubectl scale deployment apigee-hello-deployment --replicas 0
```

Show that your browser is now hitting the GKE us-east cluster

Scale the deployment back to 2
```
kubectl scale deployment apigee-hello-deployment --replicas 2
```

Show the following
* Show that you browser is not hitting the GKE central cluster;
* show the GKE load balancer monitoring tab;
* show the results of the load runner tool and the errors that were returned to the client applications.  


## Load Testing
Install the following tool to load test
https://www.npmjs.com/package/loadtest

loadtest [-n requests] [-c concurrency] [-k] URL
loadtest -n 100 -c 1 --rps 1 http://IP


## Appendix

### Get the context from `kubectl` and use context when executing command

Get info on current `kubectl` config.
```
kubectl config view -o json
```

Get the current context
```
kubectl config current-context
```

Execute `kubectl` with context provided.  
```
kubectl --context="gke_apigee-target-server-lb-sw_us-east1_east-cluster" create -f app

kubectl --context="gke_apigee-target-server-lb-sw_us-central1_central-cluster" create -f app
```

### Reset health check to default values
You can reset the health check values to the default configuration.  
```
gcloud compute health-checks update http mci1-hc-30061--mci-ingress \
    --description='Health check for service {"kubernetes.io/service-name":"default/service-foo","kubernetes.io/service-port":"80"} as part of kubernetes multicluster loadbalancer mci-ingress' \
    --check-interval=60s \
    --timeout=60s \
    --healthy-threshold=1 \
    --unhealthy-threshold=10
```

### DELETE mci-ingress
kubemci delete mci-ingress --ingress=hello-ingress-mci.yaml --kubeconfig=mcikubeconfig
