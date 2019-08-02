#!/bin/bash

# delete the mci components
kubemci delete mci-ingress --ingress=app/hello-ingress-mci.yaml --kubeconfig=$HOME/mcikubeconfig

# delete the services
gcloud container clusters get-credentials gke-cluster-uscentral --zone us-central1-a
kubectl delete services -l app=apigee-hello-app-mci

gcloud container clusters get-credentials gke-cluster-useast --zone us-east1-b
kubectl delete services -l app=apigee-hello-app-mci
