#! /bin/bash

export NAME="gke-cluster-useast"
export ZONE="us-east1-b"
gcloud deployment-manager deployments create ${NAME} \
--template cluster.jinja \
--properties zone:${ZONE}

export NAME="gke-cluster-uscentral"
export ZONE="us-central1-a"
gcloud deployment-manager deployments create ${NAME} \
--template cluster.jinja \
--properties zone:${ZONE}

./app/deploy-app.sh
