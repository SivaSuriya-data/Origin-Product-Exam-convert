#!/bin/bash

# AWS EKS Deployment Script for get-converted-exams

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="get-converted-exams-cluster"
AWS_REGION="us-west-2"
NAMESPACE="get-converted-exams"
DOMAIN="getconvertedexams.io"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${BLUE}🚀 Starting AWS EKS deployment for get-converted-exams${NC}"

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

if ! command_exists eksctl; then
    echo -e "${RED}❌ eksctl is not installed${NC}"
    echo "Install eksctl: https://eksctl.io/introduction/#installation"
    exit 1
fi

if ! command_exists aws; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

if ! command_exists helm; then
    echo -e "${RED}❌ Helm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check AWS credentials
echo -e "${YELLOW}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo -e "${BLUE}📋 AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Create EKS cluster if it doesn't exist
echo -e "${YELLOW}🏗️ Checking if EKS cluster exists...${NC}"
if eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
    echo -e "${GREEN}✅ EKS cluster '$CLUSTER_NAME' already exists${NC}"
else
    echo -e "${YELLOW}🏗️ Creating EKS cluster...${NC}"
    echo -e "${RED}⚠️ This will take 15-20 minutes${NC}"
    
    # Update cluster config with actual key pair name
    read -p "Enter your EC2 Key Pair name (or press Enter to skip SSH access): " KEY_PAIR
    if [ ! -z "$KEY_PAIR" ]; then
        sed -i.bak "s/your-key-pair/$KEY_PAIR/g" aws-eks/cluster-config.yaml
    else
        # Remove SSH configuration if no key pair provided
        sed -i.bak '/ssh:/,/publicKeyName:/d' aws-eks/cluster-config.yaml
    fi
    
    eksctl create cluster -f aws-eks/cluster-config.yaml
    
    # Restore backup
    mv aws-eks/cluster-config.yaml.bak aws-eks/cluster-config.yaml 2>/dev/null || true
    
    echo -e "${GREEN}✅ EKS cluster created successfully${NC}"
fi

# Update kubeconfig
echo -e "${YELLOW}⚙️ Updating kubeconfig...${NC}"
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

# Install AWS Load Balancer Controller
echo -e "${YELLOW}🔧 Installing AWS Load Balancer Controller...${NC}"

# Create IAM role for AWS Load Balancer Controller
echo -e "${YELLOW}🔑 Creating IAM role for AWS Load Balancer Controller...${NC}"

# Download IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json \
    --region $AWS_REGION 2>/dev/null || echo "Policy already exists"

rm iam_policy.json

# Create IAM role and service account
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --region $AWS_REGION 2>/dev/null || echo "Service account already exists"

# Install AWS Load Balancer Controller using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$AWS_REGION \
  --set vpcId=$(aws eks describe-cluster --name $CLUSTER_NAME --region $AWS_REGION --query "cluster.resourcesVpcConfig.vpcId" --output text)

echo -e "${GREEN}✅ AWS Load Balancer Controller installed${NC}"

# Install Cluster Autoscaler
echo -e "${YELLOW}🔧 Installing Cluster Autoscaler...${NC}"

# Create IAM role for Cluster Autoscaler
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=cluster-autoscaler \
  --attach-policy-arn=arn:aws:iam::aws:policy/AutoScalingFullAccess \
  --override-existing-serviceaccounts \
  --approve \
  --region $AWS_REGION

# Update cluster autoscaler deployment with account ID
sed -i.bak "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws-eks/cluster-autoscaler.yaml

kubectl apply -f aws-eks/cluster-autoscaler.yaml

# Restore backup
mv aws-eks/cluster-autoscaler.yaml.bak aws-eks/cluster-autoscaler.yaml 2>/dev/null || true

echo -e "${GREEN}✅ Cluster Autoscaler installed${NC}"

# Install Metrics Server
echo -e "${YELLOW}🔧 Installing Metrics Server...${NC}"
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Deploy application
echo -e "${YELLOW}🚀 Deploying application...${NC}"

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Update deployment with ECR URI
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/get-converted-exams"
sed -i.bak "s|your-account-id.dkr.ecr.us-west-2.amazonaws.com/get-converted-exams:latest|$ECR_URI:latest|g" aws-eks/deployment.yaml

# Apply deployment
kubectl apply -f aws-eks/deployment.yaml

# Apply HPA
kubectl apply -f aws-eks/hpa.yaml

# Apply PDB
kubectl apply -f k8s/pdb.yaml

# Restore backup
mv aws-eks/deployment.yaml.bak aws-eks/deployment.yaml 2>/dev/null || true

echo -e "${GREEN}✅ Application deployed${NC}"

# Configure SSL certificate (optional)
echo -e "${YELLOW}🔒 SSL Certificate Configuration${NC}"
echo -e "${BLUE}To enable HTTPS, you need to:${NC}"
echo -e "1. Request an SSL certificate in AWS Certificate Manager"
echo -e "2. Update the certificate ARN in aws-eks/ingress-alb.yaml"
echo -e "3. Apply the ingress: kubectl apply -f aws-eks/ingress-alb.yaml"

read -p "Do you want to apply the ALB ingress now? (y/N): " APPLY_INGRESS
if [[ $APPLY_INGRESS =~ ^[Yy]$ ]]; then
    read -p "Enter your SSL certificate ARN (or press Enter to skip HTTPS): " CERT_ARN
    if [ ! -z "$CERT_ARN" ]; then
        sed -i.bak "s|arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/CERTIFICATE_ID|$CERT_ARN|g" aws-eks/ingress-alb.yaml
    fi
    
    sed -i.bak "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws-eks/ingress-alb.yaml
    kubectl apply -f aws-eks/ingress-alb.yaml
    
    # Restore backup
    mv aws-eks/ingress-alb.yaml.bak aws-eks/ingress-alb.yaml 2>/dev/null || true
    
    echo -e "${GREEN}✅ ALB Ingress applied${NC}"
fi

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/get-converted-exams -n $NAMESPACE

# Get deployment status
echo -e "${YELLOW}📊 Checking deployment status...${NC}"
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE 2>/dev/null || echo "No ingress configured"

# Get ALB DNS name
ALB_DNS=$(kubectl get ingress get-converted-exams-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Not configured")

echo -e "${GREEN}🎉 EKS deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Deployment Details:${NC}"
echo -e "   Cluster: $CLUSTER_NAME"
echo -e "   Region: $AWS_REGION"
echo -e "   Namespace: $NAMESPACE"
echo -e "   Replicas: $(kubectl get deployment get-converted-exams -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')"

if [ "$ALB_DNS" != "Not configured" ]; then
    echo -e "   ALB DNS: $ALB_DNS"
    echo -e "${GREEN}🌐 Application will be accessible at: http://$ALB_DNS${NC}"
    echo -e "${YELLOW}📝 Configure your domain DNS to point to: $ALB_DNS${NC}"
fi

echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View pods: kubectl get pods -n $NAMESPACE"
echo -e "   View logs: kubectl logs -f deployment/get-converted-exams -n $NAMESPACE"
echo -e "   Scale deployment: kubectl scale deployment get-converted-exams --replicas=5 -n $NAMESPACE"
echo -e "   Delete cluster: eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION"

echo -e "${GREEN}✅ EKS deployment script completed${NC}"