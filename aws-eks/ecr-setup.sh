#!/bin/bash

# ECR Setup Script for AWS EKS Deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-west-2"
ECR_REPOSITORY="get-converted-exams"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${BLUE}🚀 Setting up ECR for get-converted-exams${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI is not configured or credentials are invalid${NC}"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"
echo -e "${BLUE}📋 AWS Account ID: $AWS_ACCOUNT_ID${NC}"
echo -e "${BLUE}📋 Region: $AWS_REGION${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Creating ECR repository...${NC}"
if aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ECR repository '$ECR_REPOSITORY' already exists${NC}"
else
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}✅ ECR repository '$ECR_REPOSITORY' created${NC}"
fi

# Set lifecycle policy to manage image retention
echo -e "${YELLOW}📋 Setting lifecycle policy...${NC}"
cat > lifecycle-policy.json << EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Keep last 10 production images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["v"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 2,
            "description": "Keep last 5 latest images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["latest"],
                "countType": "imageCountMoreThan",
                "countNumber": 5
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 3,
            "description": "Delete untagged images older than 1 day",
            "selection": {
                "tagStatus": "untagged",
                "countType": "sinceImagePushed",
                "countUnit": "days",
                "countNumber": 1
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF

aws ecr put-lifecycle-policy \
    --repository-name $ECR_REPOSITORY \
    --lifecycle-policy-text file://lifecycle-policy.json \
    --region $AWS_REGION

rm lifecycle-policy.json

# Get login token and login to ECR
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo -e "${GREEN}✅ Successfully logged into ECR${NC}"

# Build and tag the Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t $ECR_REPOSITORY:latest .

# Tag for ECR
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
docker tag $ECR_REPOSITORY:latest $ECR_URI:latest
docker tag $ECR_REPOSITORY:latest $ECR_URI:$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}✅ Docker image built and tagged${NC}"

# Push to ECR
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push $ECR_URI:latest
docker push $ECR_URI:$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}✅ Image pushed to ECR successfully${NC}"

# Create Kubernetes secret for ECR access
echo -e "${YELLOW}🔑 Creating Kubernetes secret for ECR...${NC}"
kubectl create namespace get-converted-exams --dry-run=client -o yaml | kubectl apply -f -

# Get ECR token for Kubernetes secret
TOKEN=$(aws ecr get-login-password --region $AWS_REGION)
kubectl create secret docker-registry ecr-registry-secret \
    --docker-server=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com \
    --docker-username=AWS \
    --docker-password=$TOKEN \
    --namespace=get-converted-exams \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✅ Kubernetes secret created${NC}"

# Update deployment file with correct ECR URI
echo -e "${YELLOW}📝 Updating deployment configuration...${NC}"
sed -i.bak "s|your-account-id.dkr.ecr.us-west-2.amazonaws.com/get-converted-exams:latest|$ECR_URI:latest|g" aws-eks/deployment.yaml

echo -e "${GREEN}🎉 ECR setup completed successfully!${NC}"
echo -e "${BLUE}📋 ECR Repository URI: $ECR_URI${NC}"
echo -e "${BLUE}📋 Image Tags: latest, $(date +%Y%m%d-%H%M%S)${NC}"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Update aws-eks/deployment.yaml with your ECR URI (already done)"
echo -e "   2. Run ./deploy-eks.sh to deploy to EKS"
echo -e "   3. Configure your domain DNS to point to the ALB"

# Restore backup
mv aws-eks/deployment.yaml.bak aws-eks/deployment.yaml 2>/dev/null || true