#!/bin/bash

# Kubernetes deployment script for get-converted-exams

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="your-dockerhub-username/get-converted-exams"
DOMAIN="your-domain.com"
NAMESPACE="get-converted-exams"

echo -e "${BLUE}🚀 Starting Kubernetes deployment for get-converted-exams${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if kubectl can connect to cluster
echo -e "${YELLOW}🔗 Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    echo "Please ensure your kubectl is configured correctly"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"

# Build and push Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t $DOCKER_IMAGE:latest .

echo -e "${YELLOW}📤 Pushing Docker image to registry...${NC}"
docker push $DOCKER_IMAGE:latest

# Update deployment with new image
echo -e "${YELLOW}📝 Updating deployment configuration...${NC}"
sed -i.bak "s|your-dockerhub-username/get-converted-exams:latest|$DOCKER_IMAGE:latest|g" k8s/deployment.yaml
sed -i.bak "s|your-domain.com|$DOMAIN|g" k8s/ingress.yaml

# Apply Kubernetes manifests
echo -e "${YELLOW}🎯 Applying Kubernetes manifests...${NC}"

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply Deployment
kubectl apply -f k8s/deployment.yaml

# Apply Service
kubectl apply -f k8s/service.yaml

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

# Apply HPA
kubectl apply -f k8s/hpa.yaml

# Apply PDB
kubectl apply -f k8s/pdb.yaml

# Apply Network Policy (optional)
kubectl apply -f k8s/networkpolicy.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/get-converted-exams -n $NAMESPACE

# Check deployment status
echo -e "${YELLOW}📊 Checking deployment status...${NC}"
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

# Get external IP
EXTERNAL_IP=$(kubectl get ingress get-converted-exams-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Application Details:${NC}"
echo -e "   Namespace: $NAMESPACE"
echo -e "   Replicas: $(kubectl get deployment get-converted-exams -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')"
echo -e "   External IP: $EXTERNAL_IP"
echo -e "   Domain: $DOMAIN"

if [ "$EXTERNAL_IP" != "Pending" ]; then
    echo -e "${GREEN}🌐 Application is accessible at: https://$DOMAIN${NC}"
else
    echo -e "${YELLOW}⏳ External IP is still pending. Check ingress controller status.${NC}"
fi

echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View pods: kubectl get pods -n $NAMESPACE"
echo -e "   View logs: kubectl logs -f deployment/get-converted-exams -n $NAMESPACE"
echo -e "   Scale deployment: kubectl scale deployment get-converted-exams --replicas=5 -n $NAMESPACE"
echo -e "   Delete deployment: kubectl delete namespace $NAMESPACE"

# Restore original files
mv k8s/deployment.yaml.bak k8s/deployment.yaml 2>/dev/null || true
mv k8s/ingress.yaml.bak k8s/ingress.yaml 2>/dev/null || true

echo -e "${GREEN}✅ Deployment script completed${NC}"