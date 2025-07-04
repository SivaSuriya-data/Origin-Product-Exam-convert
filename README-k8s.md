# Kubernetes Deployment Guide

This guide explains how to deploy the getConvertedExams.io application to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured to access your cluster
- Docker installed and configured
- NGINX Ingress Controller installed in your cluster
- cert-manager for SSL certificates (optional)

## Quick Start

1. **Update Configuration**
   ```bash
   # Edit the deployment script with your details
   vim deploy.sh
   
   # Update these variables:
   DOCKER_IMAGE="your-dockerhub-username/get-converted-exams"
   DOMAIN="your-domain.com"
   ```

2. **Deploy to Kubernetes**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to deploy manually:

1. **Build and Push Docker Image**
   ```bash
   docker build -t your-dockerhub-username/get-converted-exams:latest .
   docker push your-dockerhub-username/get-converted-exams:latest
   ```

2. **Update Kubernetes Manifests**
   ```bash
   # Update image name in deployment.yaml
   sed -i 's|your-dockerhub-username/get-converted-exams:latest|your-actual-image|g' k8s/deployment.yaml
   
   # Update domain in ingress.yaml
   sed -i 's|your-domain.com|your-actual-domain.com|g' k8s/ingress.yaml
   ```

3. **Apply Manifests**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   kubectl apply -f k8s/hpa.yaml
   kubectl apply -f k8s/pdb.yaml
   ```

## Configuration Files

### Core Components

- `namespace.yaml` - Creates dedicated namespace
- `deployment.yaml` - Main application deployment
- `service.yaml` - Service to expose pods
- `ingress.yaml` - Ingress for external access
- `configmap.yaml` - Nginx configuration

### Scaling & Reliability

- `hpa.yaml` - Horizontal Pod Autoscaler
- `pdb.yaml` - Pod Disruption Budget
- `networkpolicy.yaml` - Network security policies

### Monitoring

- `monitoring.yaml` - Prometheus monitoring setup
- `secrets.yaml` - Secret management

## Customization

### Resource Limits

Edit `deployment.yaml` to adjust resource requests and limits:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Scaling Configuration

Edit `hpa.yaml` to adjust autoscaling behavior:

```yaml
minReplicas: 2
maxReplicas: 10
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
```

### SSL/TLS Configuration

The ingress is configured for SSL with cert-manager. Ensure you have:

1. cert-manager installed
2. ClusterIssuer configured
3. DNS pointing to your cluster

## Monitoring and Maintenance

### Check Deployment Status
```bash
kubectl get pods -n get-converted-exams
kubectl get services -n get-converted-exams
kubectl get ingress -n get-converted-exams
```

### View Logs
```bash
kubectl logs -f deployment/get-converted-exams -n get-converted-exams
```

### Scale Manually
```bash
kubectl scale deployment get-converted-exams --replicas=5 -n get-converted-exams
```

### Update Application
```bash
# Build new image
docker build -t your-dockerhub-username/get-converted-exams:v2.0 .
docker push your-dockerhub-username/get-converted-exams:v2.0

# Update deployment
kubectl set image deployment/get-converted-exams get-converted-exams=your-dockerhub-username/get-converted-exams:v2.0 -n get-converted-exams
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n get-converted-exams
   ```

2. **Service not accessible**
   ```bash
   kubectl get endpoints -n get-converted-exams
   ```

3. **Ingress issues**
   ```bash
   kubectl describe ingress get-converted-exams-ingress -n get-converted-exams
   ```

### Health Checks

The application includes health check endpoints:
- Liveness probe: `GET /`
- Readiness probe: `GET /`
- Custom health check: `GET /health`

## Security Considerations

- Network policies restrict pod-to-pod communication
- Security headers are configured in nginx
- CORS headers are properly set for WASM execution
- Resource limits prevent resource exhaustion

## Cleanup

To remove the entire deployment:

```bash
kubectl delete namespace get-converted-exams
```

## Production Considerations

1. **Backup Strategy**: Implement regular backups if using persistent storage
2. **Monitoring**: Set up comprehensive monitoring with Prometheus/Grafana
3. **Logging**: Configure centralized logging with ELK stack or similar
4. **Security**: Regular security scans and updates
5. **Performance**: Monitor and optimize based on usage patterns