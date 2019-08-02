# Container Native Load Balancing

## Summary
Container native load balancing allows an HTTPS load balancer to distribute traffic directly to pods running in GKE clusters as opposed to used instance groups.  Please read the Google documentation links below.

It turns out this is not a feasible option since it creates a new HTTPS global load balancer for each region. However, the goal is to have a single GLB for all GKE clusters.  I also attempted to modify the existing HTTPS LB with the backend created from the other region, but it does not behave as expected.  
* If you add a backend service from another region then you also have to specify the host and route, which is where the problem arises. You have to specify a different route for each backend service.  
  * i.e. `/` maps to `us-east-be` and `/*` maps to `us-central-be` 
* However, it does handle load balancing across zones and keeps the NEG updated if you scale your service up or down.  

## Google documentation
* [Container Native Load Balancing](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing)
* [Network Endpoint Groups](https://cloud.google.com/kubernetes-engine/docs/how-to/container-native-load-balancing)

## Deployment

### Manual Deployment

#### 1. Create the clusters
```
gcloud container clusters create neg-demo-cluster-uscentral \
    --enable-ip-alias \
    --create-subnetwork="" \
    --network=default \
    --zone=us-central1-a
```

```
gcloud container clusters create neg-demo-cluster-useast \
    --enable-ip-alias \
    --create-subnetwork="" \
    --network=default \
    --zone=us-east1-b
```

#### 2. Deploy the app

```
export GCP_PROJECT=$(gcloud config get-value project)
export ZONE="us-central1-a"
export CLUSTER="neg-demo-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
```

Deploy the app and find and replace the values in the
```
cat app/deployment/hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -
```

Deploy to the east zone.
```
export ZONE="us-east1-b"
export CLUSTER="neg-demo-cluster-useast"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
```

```
cat app/deployment/hello-deployment.yaml | sed 's/\$GCP_PROJECT'"/$GCP_PROJECT/g" \
| sed 's/\$REGION'"/$ZONE/g" | kubectl apply -f -
```

#### 3. Create the service in both zones

```
export ZONE="us-central1-a"
export CLUSTER="neg-demo-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl apply -f app/deployment/hello-service.yaml
```

```
export ZONE="us-east1-b"
export CLUSTER="neg-demo-cluster-useast"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl apply -f app/deployment/hello-service.yaml
```

#### 4. Create the ingress for the service
This create the Global HTTPS LB with east as the backend.
```
kubectl apply -f app/deployment/hello-ingress.yaml
```

**The problem with this approach is that is creates a new Global HTTPS LB, but I want one Global LB for all NEGs.**
```
export ZONE="us-central1-a"
export CLUSTER="neg-demo-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl apply -f app/deployment/hello-ingress.yaml
```

##### My attempt to create all components directly
This is my attempt to create all the components for this to work (NEG, Backends, etc.), but this is more complicated and I did not complete all the steps for it to work correctly.  

Get the subnetwork name
```
export ZONE="us-central1-a"
export CLUSTER="neg-demo-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
```

Create the NEG for central region.
```
gcloud compute network-endpoint-groups create neg-uscentral \
    --network=default \
    --default-port=80  \
    --subnet=$(gcloud container clusters describe neg-demo-cluster-uscentral --format='value[](subnetwork)') \
    --zone=us-central1-a
```

#### 5. Verify the ingress
```
kubectl describe ingress apigee-hello-neg-ingress
```

```
kubectl get ingress apigee-hello-neg-ingress

```

### Delete the components
#### Delete the cluster
```
gcloud container clusters delete  neg-demo-cluster-uscentral --region=us-central1-a

gcloud container clusters delete neg-demo-cluster-useast --region=us-east1-b
```

#### Delete the ingress
```
export ZONE="us-central1-a"
export CLUSTER="neg-demo-cluster-uscentral"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl delete ingress apigee-hello-neg-ingress
```

```
export ZONE="us-east1-b"
export CLUSTER="neg-demo-cluster-useast"
gcloud container clusters get-credentials ${CLUSTER} --zone ${ZONE}
kubectl delete ingress apigee-hello-neg-ingress
```
