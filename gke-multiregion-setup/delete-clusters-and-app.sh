#! /bin/bash
gcloud deployment-manager deployments delete gke-cluster-uscentral
gcloud deployment-manager deployments delete gke-cluster-useast
./app/delete-app.sh
