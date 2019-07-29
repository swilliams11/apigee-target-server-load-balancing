# gke-multregion-setup

## Summary
This documentation describes how to deploy two GKE clusters in GCP - one in us-central and one in us-east.

## Deploy GKE clusters
### Deploy clusters with script
```
chmod 777 deploy-clusters-and-app.sh
chmod 777 delete-clusters-and-app.sh
chmod 777 app/deploy-app.sh
chmod 777 app/delete-app.sh
./deploy-clusters-and-app.sh
```

Get the IPs of the ingress in central and east
```
export ZONE="us-central1-a"
export CLUSTER="gke-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl get svc apigee-hello-service  -o jsonpath="{.status.loadBalancer.ingress[*].ip}" -w

export ZONE="us-east1-b"
export CLUSTER="gke-cluster-useast"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl get svc apigee-hello-service  -o jsonpath="{.status.loadBalancer.ingress[*].ip}" -w

```

## Manual deployment
1. Deploy clusters to east and central regions.  
```
export NAME="gke-cluster-useast"
export ZONE="us-east1-b"
gcloud deployment-manager deployments create ${NAME} \
--template cluster.jinja \
--properties zone:${ZONE}
```

```
export NAME="gke-cluster-uscentral"
export ZONE="us-central1-a"
gcloud deployment-manager deployments create ${NAME} \
--template cluster.jinja \
--properties zone:${ZONE}
```

## Delete the deployment
```
gcloud deployment-manager deployments delete gke-cluster-useast
gcloud deployment-manager deployments delete gke-cluster-uscentral
```
