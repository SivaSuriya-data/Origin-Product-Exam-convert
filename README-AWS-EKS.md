# AWS EKS Deployment Guide

This guide provides step-by-step instructions for deploying the getConvertedExams.io application to Amazon EKS (Elastic Kubernetes Service).

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Route 53      │    │   Application    │    │   Auto Scaling  │
│   (DNS)         │───▶│   Load Balancer  │───▶│   Group         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   EKS Cluster    │    │   EC2 Instances │
                       │   (Control Plane)│    │   (Worker Nodes)│
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   ECR Registry   │
                       │   (Docker Images)│
                       └──────────────────┘
```

## 📋 Prerequisites

### Required Tools
- **AWS CLI** (v2.0+) - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **eksctl** (v0.150+) - [Installation Guide](https://eksctl.io/introduction/#installation)
- **kubectl** (v1.28+) - [Installation Guide](https://kubernetes.io/docs/tasks/tools/)
- **Helm** (v3.0+) - [Installation Guide](https://helm.sh/docs/intro/install/)
- **Docker** - [Installation Guide](https://docs.docker.com/get-docker/)

### AWS Requirements
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- EC2 Key Pair (optional, for SSH access to nodes)

### Required AWS Permissions
Your AWS user/role needs the following permissions:
- EKS Full Access
- EC2 Full Access
- IAM Full Access
- CloudFormation Full Access
- ECR Full Access
- Route53 (if using custom domain)
- Certificate Manager (for SSL)

## 🚀 Quick Start

### 1. Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and Output format
```

### 2. Clone and Setup
```bash
git clone <your-repo>
cd get-converted-exams
```

### 3. Setup ECR and Build Image
```bash
chmod +x aws-eks/ecr-setup.sh
./aws-eks/ecr-setup.sh
```

### 4. Deploy to EKS
```bash
chmod +x aws-eks/deploy-eks.sh
./aws-eks/deploy-eks.sh
```

## 📝 Detailed Deployment Steps

### Step 1: ECR Setup

The ECR setup script will:
- Create an ECR repository
- Build and push your Docker image
- Create Kubernetes secrets for ECR access

```bash
./aws-eks/ecr-setup.sh
```

### Step 2: EKS Cluster Creation

The deployment script will create:
- EKS cluster with 3 worker nodes
- VPC with public/private subnets
- IAM roles and policies
- Security groups

```bash
./aws-eks/deploy-eks.sh
```

**Note**: Cluster creation takes 15-20 minutes.

### Step 3: Install Add-ons

The script automatically installs:
- **AWS Load Balancer Controller** - For ALB ingress
- **Cluster Autoscaler** - For automatic node scaling
- **Metrics Server** - For HPA metrics
- **CloudWatch Agent** - For monitoring

### Step 4: Deploy Application

The application deployment includes:
- 3 replicas with auto-scaling (3-20 pods)
- Health checks and resource limits
- ConfigMap for Nginx configuration
- Horizontal Pod Autoscaler

## 🔧 Configuration

### Cluster Configuration

Edit `aws-eks/cluster-config.yaml` to customize:

```yaml
metadata:
  name: get-converted-exams-cluster
  region: us-west-2  # Change to your preferred region

nodeGroups:
  - name: worker-nodes
    instanceType: t3.medium  # Change instance type
    desiredCapacity: 3       # Change node count
    minSize: 2
    maxSize: 10
```

### Application Configuration

Edit `aws-eks/deployment.yaml` to customize:

```yaml
spec:
  replicas: 3  # Initial replica count
  
containers:
- name: get-converted-exams
  resources:
    requests:
      memory: "512Mi"  # Adjust memory
      cpu: "250m"      # Adjust CPU
    limits:
      memory: "1Gi"
      cpu: "500m"
```

### Auto-scaling Configuration

Edit `aws-eks/hpa.yaml`:

```yaml
spec:
  minReplicas: 3   # Minimum pods
  maxReplicas: 20  # Maximum pods
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # CPU threshold
```

## 🌐 Domain and SSL Setup

### 1. Request SSL Certificate

```bash
# Request certificate in AWS Certificate Manager
aws acm request-certificate \
    --domain-name getconvertedexams.io \
    --subject-alternative-names www.getconvertedexams.io \
    --validation-method DNS \
    --region us-west-2
```

### 2. Update Ingress Configuration

Edit `aws-eks/ingress-alb.yaml`:

```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/YOUR_CERT_ID
spec:
  rules:
  - host: getconvertedexams.io  # Your domain
```

### 3. Apply Ingress

```bash
kubectl apply -f aws-eks/ingress-alb.yaml
```

### 4. Configure DNS

Point your domain to the ALB DNS name:

```bash
# Get ALB DNS name
kubectl get ingress get-converted-exams-ingress -n get-converted-exams

# Create Route53 record or update your DNS provider
```

## 📊 Monitoring and Logging

### CloudWatch Integration

The deployment includes CloudWatch integration for:
- Container logs
- Cluster metrics
- Application performance metrics

### View Logs

```bash
# Application logs
kubectl logs -f deployment/get-converted-exams -n get-converted-exams

# All pods logs
kubectl logs -f -l app=get-converted-exams -n get-converted-exams
```

### Monitoring Commands

```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Check application status
kubectl get pods -n get-converted-exams
kubectl get services -n get-converted-exams
kubectl get ingress -n get-converted-exams

# Check HPA status
kubectl get hpa -n get-converted-exams

# Check cluster autoscaler
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Build new image
./aws-eks/ecr-setup.sh

# Update deployment
kubectl rollout restart deployment/get-converted-exams -n get-converted-exams

# Check rollout status
kubectl rollout status deployment/get-converted-exams -n get-converted-exams
```

### Scale Application

```bash
# Manual scaling
kubectl scale deployment get-converted-exams --replicas=10 -n get-converted-exams

# Update HPA limits
kubectl patch hpa get-converted-exams-hpa -n get-converted-exams -p '{"spec":{"maxReplicas":30}}'
```

### Update Cluster

```bash
# Update EKS cluster version
eksctl update cluster --name get-converted-exams-cluster --region us-west-2

# Update node groups
eksctl update nodegroup --cluster get-converted-exams-cluster --name worker-nodes --region us-west-2
```

## 💰 Cost Optimization

### Right-sizing Resources

1. **Monitor resource usage**:
   ```bash
   kubectl top pods -n get-converted-exams
   kubectl top nodes
   ```

2. **Adjust resource requests/limits** based on actual usage

3. **Use Spot Instances** for cost savings:
   ```yaml
   # In cluster-config.yaml
   nodeGroups:
   - name: spot-workers
     instancesDistribution:
       maxPrice: 0.10
       instanceTypes: ["t3.medium", "t3.large"]
       onDemandBaseCapacity: 1
       onDemandPercentageAboveBaseCapacity: 0
       spotInstancePools: 3
   ```

### Auto-scaling Configuration

- Set appropriate min/max replicas
- Configure cluster autoscaler for node scaling
- Use HPA for pod scaling based on metrics

## 🔒 Security Best Practices

### Network Security
- Private subnets for worker nodes
- Security groups with minimal required access
- Network policies for pod-to-pod communication

### IAM Security
- Least privilege IAM roles
- Service accounts with specific permissions
- Regular rotation of access keys

### Container Security
- Regular image scanning with ECR
- Non-root containers
- Resource limits and security contexts

## 🚨 Troubleshooting

### Common Issues

1. **Pods not starting**:
   ```bash
   kubectl describe pod <pod-name> -n get-converted-exams
   kubectl logs <pod-name> -n get-converted-exams
   ```

2. **ALB not accessible**:
   ```bash
   kubectl describe ingress get-converted-exams-ingress -n get-converted-exams
   kubectl logs -f deployment/aws-load-balancer-controller -n kube-system
   ```

3. **Auto-scaling not working**:
   ```bash
   kubectl describe hpa get-converted-exams-hpa -n get-converted-exams
   kubectl logs -f deployment/metrics-server -n kube-system
   ```

4. **Cluster autoscaler issues**:
   ```bash
   kubectl logs -f deployment/cluster-autoscaler -n kube-system
   ```

### Health Checks

```bash
# Check all components
kubectl get componentstatuses

# Check node health
kubectl get nodes -o wide

# Check system pods
kubectl get pods -n kube-system

# Check application health
kubectl get pods -n get-converted-exams -o wide
```

## 🧹 Cleanup

### Delete Application Only
```bash
kubectl delete namespace get-converted-exams
```

### Delete Entire Cluster
```bash
eksctl delete cluster --name get-converted-exams-cluster --region us-west-2
```

### Delete ECR Repository
```bash
aws ecr delete-repository --repository-name get-converted-exams --force --region us-west-2
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review AWS EKS documentation
3. Check Kubernetes documentation
4. Review application logs

## 🔗 Useful Links

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl Documentation](https://eksctl.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)