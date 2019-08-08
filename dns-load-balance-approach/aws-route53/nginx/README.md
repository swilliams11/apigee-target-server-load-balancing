# Nginx

Please the [README](..) in the aws-route53 folder for details on how to deploy.

## Summary
These files were taken from the [kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress/blob/v1.5.1/docs/installation.md) repository and some of them were slightly modified to implement this use case for my hello world app.

This folder contains several files:
* `default-server-secret.yaml` - TLS certificate
* `nginx-config.yaml` - used to customize Nginx
* `nginx-ingress.yaml` - this is the nginx Deployment
* `nodeport.yaml` - NodePort service to expose a `31080` and `31443` on all VMs in cluster and maps to port `80` in the container running Nginx. 
* `ns-and-sa.yaml` - creates a namespace
* `rbac.yaml` - RBAC for namespace
