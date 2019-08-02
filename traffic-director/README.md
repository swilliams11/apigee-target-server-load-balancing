# Traffic Director

## Summary
This README documents how to setup Traffic Director to load balance traffic between GKE clusters in multiple regions.  It relies on Network Endpoint Groups, which are currently in Beta release.

I don't believe that this approach will work to load balance public traffic across GKE clusters in separate regions.  Our documentation states the following:
* "You can only connect services running in GCP using Traffic Director."

Therefore, you cannot load balance public traffic.  No public IP address is assigned to the Traffic Director.  

## Links
* [Preparing for traffic director setup](https://cloud.google.com/traffic-director/docs/setting-up-traffic-director)
* [Setup for GKE pods](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)

## Setup

## Manual Setup
The manual steps follow the documentation listed in [Setup for GKE pods](https://cloud.google.com/traffic-director/docs/set-up-gke-pods)

### 1. Create the cluster

```
gcloud container clusters create traffic-director-cluster-uscentral \
  --zone us-central1-a \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --enable-ip-alias

gcloud container clusters create traffic-director-cluster-useast \
    --zone us-east1-b \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --enable-ip-alias
```

### 2. Configure Traffic Director in us-central

```
gcloud container clusters get-credentials traffic-director-cluster-uscentral \
    --zone us-central1-a
```

Enable permissions
```
NODE_SCOPES="monitoring,logging-write,storage-ro,cloud-platform"
GCE_GLBC_IMAGE=k8s.gcr.io/ingress-gce-glbc-amd64:v1.2.3
ENABLE_IP_ALIASES=true
```

Deploy a sample service to GKE clusters for testing.
```
kubectl apply -f app/deployment/trafficdirector-service-sample.yaml
```

Verify the service
```
kubectl get svc
kubectl get pods
```


Get the NEG name and save it.
```
gcloud beta compute network-endpoint-groups list
NEG_NAME=$(gcloud beta compute network-endpoint-groups list \
| grep service-test | awk '{print $1}')
```

There are several steps that need to be taken to get to this point.  This is an example deployment configured to be load balanced by Traffic Director.
```
kubectl apply -f app/deployment/trafficdirector-client-sample.yaml
```

#### Configure GCP components for Traffic Director`
Create the health check.
```
gcloud compute health-checks create http td-gke-health-check \
    --use-serving-port
```

Create the backend service
```
gcloud compute backend-services create td-gke-service \
    --global \
    --health-checks td-gke-health-check \
    --load-balancing-scheme INTERNAL_SELF_MANAGED
```

Add backend NEGs to the backend service
```
gcloud compute backend-services add-backend td-gke-service \
    --global \
    --network-endpoint-group ${NEG_NAME} \
    --network-endpoint-group-zone us-central1-a \
    --balancing-mode RATE \
    --max-rate-per-endpoint 5
```

#### Create the Route rules
```
gcloud compute url-maps create td-gke-url-map \
   --default-service td-gke-service

gcloud compute url-maps add-path-matcher td-gke-url-map \
  --default-service td-gke-service \
  --path-matcher-name td-gke-path-matcher

gcloud compute url-maps add-host-rule td-gke-url-map \
   --hosts service-test \
   --path-matcher-name td-gke-path-matcher

gcloud compute target-http-proxies create td-gke-proxy \
  --url-map td-gke-url-map


gcloud compute forwarding-rules create td-gke-forwarding-rule \
  --global \
  --load-balancing-scheme=INTERNAL_SELF_MANAGED \
  --address=0.0.0.0 --address-region=us-central1 \
  --target-http-proxy=td-gke-proxy \
  --ports 80 --network default
```
