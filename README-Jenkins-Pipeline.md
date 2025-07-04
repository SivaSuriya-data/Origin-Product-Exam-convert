# Jenkins CI/CD Pipeline for AWS EKS

This guide provides a complete Jenkins CI/CD pipeline setup for automatically deploying your getConvertedExams.io application to AWS EKS when code is pushed to GitHub.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│   Jenkins CI/CD  │───▶│   AWS EKS       │
│   (Code Push)   │    │   Pipeline       │    │   Cluster       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Webhook       │    │   Build & Test   │    │   Rolling       │
│   Trigger       │    │   Docker Image   │    │   Deployment    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Setup

### 1. Install Jenkins on EKS
```bash
chmod +x jenkins/setup-jenkins.sh
./jenkins/setup-jenkins.sh
```

### 2. Configure Credentials
```bash
chmod +x jenkins/configure-credentials.sh
./jenkins/configure-credentials.sh
```

### 3. Set up GitHub Webhook
Follow the guide in `jenkins/github-webhook-setup.md`

## 📋 Pipeline Features

### ✅ **Automated Triggers**
- GitHub webhook integration
- Automatic builds on push/PR
- Scheduled builds (backup polling)

### ✅ **Build Process**
- Multi-stage Docker builds
- Rust WASM compilation
- Python WASM preparation
- React application build
- Security scanning with Trivy

### ✅ **Testing & Quality**
- Code linting (ESLint)
- Security vulnerability scanning
- Kubernetes manifest validation
- Docker image scanning

### ✅ **Deployment**
- Blue-green deployments
- Rolling updates with zero downtime
- Automatic rollback on failure
- Health checks and validation

### ✅ **Monitoring & Notifications**
- Slack integration
- Build status notifications
- Deployment success/failure alerts
- Performance metrics

## 🔧 Pipeline Configuration

### Environment Variables
```groovy
environment {
    AWS_REGION = 'us-west-2'
    EKS_CLUSTER_NAME = 'get-converted-exams-cluster'
    ECR_REPOSITORY = 'get-converted-exams'
    APP_NAME = 'get-converted-exams'
    NAMESPACE = 'get-converted-exams'
}
```

### Required Credentials
- `aws-credentials` - AWS Access Key & Secret
- `aws-account-id` - AWS Account ID
- `github-token` - GitHub Personal Access Token
- `kubeconfig-file` - Kubernetes config file
- `slack-token` - Slack Bot Token (optional)

## 📊 Pipeline Stages

### 1. **Checkout**
- Clone repository from GitHub
- Extract commit information
- Set build metadata

### 2. **Build Dependencies** (Parallel)
- Build Rust WASM module
- Prepare Python WASM components
- Install Node.js dependencies

### 3. **Test & Quality Checks** (Parallel)
- Run ESLint code linting
- Security vulnerability scanning
- Docker image security scan

### 4. **Build Application**
- Compile React application
- Optimize for production
- Generate build artifacts

### 5. **Build & Push Docker Image**
- Multi-stage Docker build
- Tag with build number and commit hash
- Push to Amazon ECR
- Update latest tag

### 6. **Deploy to EKS**
- Update kubeconfig for EKS access
- Rolling deployment update
- Wait for rollout completion
- Verify pod health

### 7. **Health Check**
- Application endpoint validation
- Service availability check
- Performance verification

## 🔒 Security Features

### **Image Scanning**
- Trivy security scanner integration
- Vulnerability assessment
- Base image security checks

### **Credential Management**
- AWS IAM roles and policies
- Kubernetes service accounts
- Encrypted credential storage

### **Network Security**
- Private ECR repositories
- VPC-based EKS networking
- Security group restrictions

## 📈 Monitoring & Observability

### **Build Metrics**
- Build duration tracking
- Success/failure rates
- Deployment frequency

### **Application Monitoring**
- Health check endpoints
- Performance metrics
- Error rate monitoring

### **Notifications**
```groovy
// Success notification
slackSend(
    channel: '#deployments',
    color: 'good',
    message: "✅ Deployment Successful - ${APP_NAME}:${IMAGE_TAG}"
)

// Failure notification
slackSend(
    channel: '#deployments',
    color: 'danger',
    message: "❌ Deployment Failed - Build ${BUILD_NUMBER}"
)
```

## 🔄 Advanced Features

### **Multi-Environment Support**
```groovy
stage('Deploy') {
    parallel {
        stage('Deploy to Staging') {
            when { branch 'develop' }
            steps {
                deployToEKS('staging-cluster', 'staging', APP_NAME, DOCKER_IMAGE)
            }
        }
        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                deployToEKS('prod-cluster', 'production', APP_NAME, DOCKER_IMAGE)
            }
        }
    }
}
```

### **Automatic Rollback**
```groovy
post {
    failure {
        script {
            if (env.STAGE_NAME == 'Deploy to EKS') {
                rollbackDeployment(NAMESPACE, APP_NAME)
            }
        }
    }
}
```

### **Image Cleanup**
```groovy
stage('Cleanup') {
    steps {
        cleanupOldImages(ECR_REPOSITORY, 10)
    }
}
```

## 🛠️ Customization

### **Branch-Specific Deployments**
- `main` → Production EKS cluster
- `develop` → Staging EKS cluster
- `feature/*` → Development environment

### **Custom Build Triggers**
- Push to specific branches
- Pull request creation
- Tag-based releases
- Scheduled builds

### **Notification Channels**
- Slack integration
- Email notifications
- Microsoft Teams
- Custom webhooks

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check Jenkins logs
   kubectl logs -f deployment/jenkins -n jenkins
   
   # Check build console output
   # Access Jenkins UI → Build → Console Output
   ```

2. **EKS Deployment Issues**
   ```bash
   # Verify cluster access
   aws eks update-kubeconfig --name get-converted-exams-cluster
   kubectl cluster-info
   
   # Check deployment status
   kubectl get pods -n get-converted-exams
   kubectl describe deployment get-converted-exams -n get-converted-exams
   ```

3. **ECR Push Failures**
   ```bash
   # Verify ECR permissions
   aws ecr describe-repositories
   
   # Check ECR login
   aws ecr get-login-password --region us-west-2
   ```

### **Debug Commands**
```bash
# Check Jenkins pod logs
kubectl logs -f deployment/jenkins -n jenkins

# Access Jenkins shell
kubectl exec -it deployment/jenkins -n jenkins -- /bin/bash

# Check pipeline workspace
kubectl exec -it deployment/jenkins -n jenkins -- ls -la /var/jenkins_home/workspace/
```

## 📚 Best Practices

1. **Security**
   - Use least privilege IAM roles
   - Regularly rotate credentials
   - Enable audit logging

2. **Performance**
   - Use parallel builds
   - Cache dependencies
   - Optimize Docker layers

3. **Reliability**
   - Implement health checks
   - Use rolling deployments
   - Set up monitoring alerts

4. **Maintenance**
   - Regular Jenkins updates
   - Plugin security updates
   - Backup configurations

## 🔗 Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [AWS EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**🎉 Your Jenkins CI/CD pipeline is now ready to automatically deploy your application to AWS EKS!**