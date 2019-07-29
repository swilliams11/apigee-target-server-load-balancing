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
You must have already created the GKE cluster and deployed the app to both regions. Complete the steps in [gke-multiregion-setup](../gke-multiregion-setup#deploy-clusters-with-script)

## Multi-cluster-ingress Links
https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress
https://kubernetes.io/docs/concepts/services-networking/ingress/

## Setup
### Firewall
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

### Install kubemci

#### LINUX - use this from cloud shell
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/linux/amd64/kubemci
```

#### MAC
```
curl -o kubemci https://storage.googleapis.com/kubemci-release/release/latest/bin/darwin/amd64/kubemci
```

#### Make the downloaded file executable.
```
chmod +x ./kubemci
```

### Setup KUBECONFIG
```
KUBECONFIG=~/mcikubeconfig gcloud container clusters get-credentials --zone=us-central1-a gke-cluster-uscentral
KUBECONFIG=~/mcikubeconfig gcloud container clusters get-credentials --zone=us-east1-b gke-cluster-useast
```
