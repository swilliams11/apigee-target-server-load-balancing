#!/bin/bash

# delete the mci components
kubemci delete mci-ingress --ingress=app/hello-ingress-mci.yaml --kubeconfig=mcikubeconfig

# delete the services
gcloud container clusters get-credentials gke-cluster-central --zone us-central1-a
kubectl delete services -l app=apigee-hello-app-mci

gcloud container clusters get-credentials gke-cluster-east --zone us-east1-b
kubectl delete services -l app=apigee-hello-app-mci
