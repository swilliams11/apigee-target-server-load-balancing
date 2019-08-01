# Deployment file

## Summary
This folder is used to deploy the application to GKE.

## Deploy app to GKE
1. Get the cluster credentials and deploy the deployment and service.
```
export GCP_PROJECT=$(gcloud config get-value project)
export ZONE="us-central1-a"
export CLUSTER="gke-cluster-uscentral"

gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
cat hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -

kubectl apply -f hello-service.yaml

export ZONE="us-east1-b"
export CLUSTER="gke-cluster-useast"

gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
cat hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -

kubectl apply -f hello-service.yaml
```

## Delete the deployment and service
```
export ZONE="us-central1-a"
export CLUSTER="gke-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}

kubectl delete deployment apigee-hello-deployment
kubectl delete service apigee-hello-service

export ZONE="us-east1-b"
export CLUSTER="gke-cluster-useast"

gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
export ZONE="us-east1-b"
export CLUSTER="gke-cluster-useast"

gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}

```
