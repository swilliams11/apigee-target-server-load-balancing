# Hello Application example

This example shows how to build and deploy a containerized Go web server
application using [Kubernetes](https://kubernetes.io).

Visit https://cloud.google.com/kubernetes-engine/docs/tutorials/hello-app
to follow the tutorial and deploy this application on [Google Kubernetes
Engine](https://cloud.google.com/kubernetes-engine).

This directory contains:

- `main.go` contains the HTTP server implementation. It responds to all HTTP
  requests with a  `Hello, world!` response.
- `Dockerfile` is used to build the Docker image for the application.


This example is used in many official/unofficial tutorials, some of them
include:
- [Kubernetes Engine Quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart)
- [Kubernetes Engine - Deploying a containerized web application](https://cloud.google.com/kubernetes-engine/docs/tutorials/hello-app) tutorial
- [Kubernetes Engine - Setting up HTTP Load Balancing](https://cloud.google.com/kubernetes-engine/docs/tutorials/http-balancer) tutorial

## Build the Go Docker image
The easiest way to build and deploy the Go application is to use the `deploy-app.sh` in the `app` folder.  

1. Build the Docker image.
```
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/hello-app:v1.0
```

## Build Docker image and deploy the app

Execute the following commands:
```
chmod 777 deploy-app.sh
chmod 777 delete-app.sh
./deploy-app.sh
```

## Delete the image
```
gcloud container images delete hello-app:v1.0
```