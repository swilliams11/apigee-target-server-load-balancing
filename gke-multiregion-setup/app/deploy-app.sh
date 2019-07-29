#!/bin/bash
cd "$(dirname "$0")"

#build the image in GCP
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/hello-app:v1.0

# deploy to the central region
export GCP_PROJECT=$(gcloud config get-value project)
export ZONE="us-central1-a"
export CLUSTER="gke-cluster-uscentral"
# get cluster credentials
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
# deploy the app and replace variable in yaml file with actual project name
cat deployment/hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -
# deploy the service
kubectl apply -f deployment/hello-service.yaml

# deploy to the east region
export ZONE="us-east1-b"
export CLUSTER="gke-cluster-useast"

gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
cat deployment/hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -
# deploy the service
kubectl apply -f deployment/hello-service.yaml

# wait for the services to return the IP
#export ZONE="us-central1-a"
#export CLUSTER="gke-cluster-uscentral"
# get cluster credentials
#gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
#sleep 50s; export USCENTRAL_SERVICE_IP=`kubectl get svc apigee-hello-service  -o jsonpath="{.status.loadBalancer.ingress[*].ip}"`

#export ZONE="us-east1-b"
#export CLUSTER="gke-cluster-useast"
#gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
#sleep 50s; export USEAST_SERVICE_IP=`kubectl get svc apigee-hello-service  -o jsonpath="{.status.loadBalancer.ingress[*].ip}"`

# echo output
#echo "Access your east and central services as shown below."
#echo "us-central - http://"$USCENTRAL_SERVICE_IP
#echo "us-east - http://"$USEAST_SERVICE_IP
