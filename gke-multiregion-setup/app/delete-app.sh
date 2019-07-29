#!/bin/bash
cd "$(dirname "$0")"

export GCP_PROJECT=$(gcloud config get-value project)
VALUE=$GCP_PROJECT
#kubectl config use-context gke_$VALUE_gke-cluster-useast
export CLUSTER="gke-cluster-uscentral"
export ZONE="us-central1-a"
# get cluster credentials
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl delete deployment apigee-hello-deployment
kubectl delete service apigee-hello-service

export CLUSTER="gke-cluster-useast"
export ZONE="us-east1-b"
# get cluster credentials
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
#kubectl config use-context gke_$GCP_PROJECT_gke-cluster-useast
kubectl delete deployment apigee-hello-deployment
kubectl delete service apigee-hello-service

# delete the container
gcloud container images delete gcr.io/$GCP_PROJECT/hello-app:v1.0 --force-delete-tags
