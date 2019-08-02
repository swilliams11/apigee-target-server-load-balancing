#!/bin/bash

# create the firewall rule to allow GCP health checks.
gcloud compute firewall-rules create fw-allow-health-checks \
    --network default \
    --action ALLOW \
    --direction INGRESS \
    --source-ranges 35.191.0.0/16,130.211.0.0/22 \
    --target-tags allow-health-checks \
    --rules tcp

# setup kubeconfig
export GCP_PROJECT=$(gcloud config get-value project)
KUBECONFIG=$HOME/mcikubeconfig gcloud container clusters get-credentials --zone=us-central1-a gke-cluster-uscentral
KUBECONFIG=$HOME/mcikubeconfig gcloud container clusters get-credentials --zone=us-east1-b gke-cluster-useast

# create the mci and service in both regions
gcloud container clusters get-credentials gke-cluster-uscentral --zone us-central1-a
kubectl create -f app/hello-service-mci.yaml

gcloud container clusters get-credentials gke-cluster-useast --zone us-east1-b
kubectl create -f app/hello-service-mci.yaml

# get a static ip address
gcloud compute addresses create --global global-lb-mci-ip

# create the https load balancer, healthcheck, instance groups etc.
kubemci create mci-ingress --ingress=app/hello-ingress-mci.yaml --kubeconfig=$HOME/mcikubeconfig

## update the load balancer from the default configuration.
gcloud compute health-checks update http mci1-hc-30061--mci-ingress \
    --description='Health check for service {"kubernetes.io/service-name":"default/apigee-hello-ingress","kubernetes.io/service-port":"80"} as part of kubernetes multicluster loadbalancer mci-ingress' \
    --check-interval=2s \
    --timeout=2s \
    --healthy-threshold=5 \
    --unhealthy-threshold=5
