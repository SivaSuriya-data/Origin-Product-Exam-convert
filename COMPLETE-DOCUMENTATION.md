# getConvertedExams.io - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Docker Hub Deployment](#docker-hub-deployment)
4. [File Upload & Processing Issues](#file-upload--processing-issues)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [AWS EKS Deployment](#aws-eks-deployment)
7. [Jenkins CI/CD Pipeline](#jenkins-cicd-pipeline)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Best Practices](#best-practices)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

### What is getConvertedExams.io?

getConvertedExams.io is a comprehensive browser-based web application that converts and formats documents for competitive exam applications using WebAssembly (WASM) technology. The application provides AI-powered document detection and smart formatting for various competitive exams in India.

### Key Features

- **Multi-Exam Support**: UPSC, NEET, JEE, CAT, GATE with exam-specific formatting rules
- **AI Document Detection**: Automatically identifies document types (Aadhaar, Marksheet, Photo, etc.)
- **Smart Formatting**: Resizes, compresses, and formats documents according to exam requirements
- **Browser-Based Processing**: All processing happens locally using WebAssembly - no server uploads
- **Batch Processing**: Handle multiple documents simultaneously
- **ZIP Download**: Get all formatted documents in a single ZIP file

### Supported Exams & Formats

#### UPSC
- **Photo**: 300×400px, JPEG, ≤200KB
- **Signature**: 300×100px, JPEG, ≤50KB
- **Documents**: 800×1200px, PDF, ≤500KB

#### NEET
- **Photo**: 200×230px, JPEG, ≤100KB
- **Signature**: 200×80px, JPEG, ≤30KB
- **Documents**: 600×800px, JPEG, ≤300KB

#### JEE
- **Photo**: 240×320px, JPEG, ≤150KB
- **Signature**: 240×80px, JPEG, ≤40KB
- **Documents**: 600×800px, JPEG, ≤400KB

#### CAT
- **Photo**: 200×240px, JPEG, ≤120KB
- **Signature**: 200×60px, JPEG, ≤25KB
- **Documents**: 700×900px, PDF, ≤600KB

#### GATE
- **Photo**: 240×320px, JPEG, ≤100KB
- **Signature**: 240×80px, JPEG, ≤30KB
- **Documents**: 600×800px, JPEG, ≤350KB

---

## Architecture & Technology Stack

### Frontend Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │    │   Python WASM    │    │   Rust WASM     │
│   Frontend      │───▶│   Document       │───▶│   Document      │
│   (React/Vite)  │    │   Analyzer       │    │   Formatter     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         └───────────────────┐                         │
                             ▼                         ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   ZIP Service   │    │   File Download │
                    │   (JSZip)       │    │   (Browser API) │
                    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: TypeScript + React + Vite + Tailwind CSS
- **Document Analysis**: Python compiled to WASM using Pyodide
- **Document Formatting**: Rust compiled to WASM using wasm-pack
- **File Processing**: JSZip, PDF-lib, Tesseract.js
- **Deployment**: Docker + Nginx

### Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ExamSelector.tsx
│   │   ├── FileUploader.tsx
│   │   └── ProcessingStatus.tsx
│   ├── services/           # Service classes
│   │   ├── documentAnalyzer.ts
│   │   ├── rustFormatter.ts
│   │   └── zipService.ts
│   ├── workers/            # Web Workers
│   │   └── pyodideWorker.ts
│   ├── config/             # Configuration
│   │   └── examConfigs.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── App.tsx
├── rust-formatter/         # Rust WASM module
│   ├── src/
│   │   └── lib.rs
│   └── Cargo.toml
├── scripts/               # Build scripts
│   └── build_python_wasm.py
├── Dockerfile
├── nginx.conf
└── package.json
```

---

## Docker Hub Deployment

### Question: "how to push the image to docker hub"

### Solution Provided

#### 1. Build the Docker Image
```bash
# Build the image with a tag
docker build -t your-dockerhub-username/get-converted-exams:latest .

# Alternative with version tag
docker build -t your-dockerhub-username/get-converted-exams:v1.0.0 .
```

#### 2. Login to Docker Hub
```bash
# Login to Docker Hub
docker login

# Enter your Docker Hub username and password when prompted
```

#### 3. Push the Image
```bash
# Push the latest tag
docker push your-dockerhub-username/get-converted-exams:latest

# Push specific version
docker push your-dockerhub-username/get-converted-exams:v1.0.0
```

#### 4. Automated Script
Created `scripts/docker-push.sh`:
```bash
#!/bin/bash

# Docker Hub push script for get-converted-exams

set -e

# Configuration
DOCKER_USERNAME="your-dockerhub-username"
IMAGE_NAME="get-converted-exams"
VERSION=${1:-"latest"}

echo "🐳 Building Docker image..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$VERSION .

echo "🔐 Logging into Docker Hub..."
docker login

echo "📤 Pushing image to Docker Hub..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION

echo "✅ Successfully pushed $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
```

#### 5. GitHub Actions Workflow
Created `.github/workflows/docker-publish.yml` for automated Docker Hub publishing on code push.

---

## File Upload & Processing Issues

### Question: "file is not upploading and backend not processing the document"

### Issues Identified & Solutions

#### 1. **Missing Backend Processing Logic**

**Problem**: The application was only showing UI without actual document processing.

**Solution**: Implemented complete document processing pipeline:

##### Document Analyzer Service (`src/services/documentAnalyzer.ts`)
```typescript
export class DocumentAnalyzerService {
  private worker: Worker | null = null;

  async analyzeDocuments(files: ProcessedFile[], examCode: string): Promise<ProcessedFile[]> {
    // Python WASM worker for document type detection
    // Analyzes filename patterns and content
    // Returns detected document types and new filenames
  }
}
```

##### Rust Formatter Service (`src/services/rustFormatter.ts`)
```typescript
export class RustFormatterService {
  async formatDocuments(
    files: ProcessedFile[],
    examConfig: ExamConfig,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedFile[]> {
    // Rust WASM for image processing
    // Resizes, compresses, and formats documents
    // Returns processed files ready for download
  }
}
```

#### 2. **File Upload Component Issues**

**Problem**: File upload component wasn't properly handling file processing.

**Solution**: Enhanced `FileUploader.tsx` component:
- Added proper file validation
- Implemented drag-and-drop functionality
- Added progress tracking
- Error handling and user feedback

#### 3. **Processing Pipeline Implementation**

**Solution**: Created complete processing pipeline in `App.tsx`:

```typescript
const processDocuments = async () => {
  setIsProcessing(true);
  
  try {
    // Step 1: Analyze documents with Python WASM
    setCurrentStep("Analyzing document types...");
    const analyzedFiles = await documentAnalyzer.analyzeDocuments(files, selectedExam);
    
    // Step 2: Format documents with Rust WASM
    setCurrentStep("Formatting documents...");
    const formattedFiles = await rustFormatter.formatDocuments(analyzedFiles, examConfig);
    
    // Step 3: Create ZIP file
    setCurrentStep("Creating download package...");
    const zipBlob = await zipService.createZipFromFiles(formattedFiles, selectedExam);
    
    setZipBlob(zipBlob);
  } catch (error) {
    // Error handling
  } finally {
    setIsProcessing(false);
  }
};
```

#### 4. **WASM Integration Issues**

**Problem**: WebAssembly modules weren't properly integrated.

**Solution**: 
- Fixed Rust WASM build configuration
- Implemented Python WASM worker with Pyodide
- Added proper CORS headers for WASM execution
- Updated Vite configuration for WASM support

#### 5. **Enhanced User Experience**

**Improvements Made**:
- Real-time progress tracking
- Visual feedback during processing
- Error messages and recovery options
- Batch file processing
- ZIP download functionality

---

## Kubernetes Deployment

### Question: "how to deploy this in the kubernetes"

### Solution Provided

#### 1. **Complete Kubernetes Manifests**

Created comprehensive Kubernetes deployment files:

##### Core Components
- `k8s/namespace.yaml` - Dedicated namespace
- `k8s/deployment.yaml` - Application deployment
- `k8s/service.yaml` - Service exposure
- `k8s/ingress.yaml` - External access
- `k8s/configmap.yaml` - Nginx configuration

##### Scaling & Reliability
- `k8s/hpa.yaml` - Horizontal Pod Autoscaler
- `k8s/pdb.yaml` - Pod Disruption Budget
- `k8s/networkpolicy.yaml` - Network security

##### Monitoring
- `k8s/monitoring.yaml` - Prometheus integration
- `k8s/secrets.yaml` - Secret management

#### 2. **Deployment Script**

Created `deploy.sh` for automated deployment:
```bash
#!/bin/bash

# Configuration
DOCKER_IMAGE="your-dockerhub-username/get-converted-exams"
DOMAIN="your-domain.com"
NAMESPACE="get-converted-exams"

# Build and push Docker image
docker build -t $DOCKER_IMAGE:latest .
docker push $DOCKER_IMAGE:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
```

#### 3. **Key Features**

- **Auto-scaling**: HPA based on CPU/memory usage
- **High Availability**: Multiple replicas with PDB
- **Security**: Network policies and RBAC
- **SSL/TLS**: cert-manager integration
- **Monitoring**: Prometheus metrics
- **Health Checks**: Liveness and readiness probes

---

## AWS EKS Deployment

### Question: "i need to deploy it in AWS EKS"

### Solution Provided

#### 1. **EKS Cluster Setup**

##### Cluster Configuration (`aws-eks/cluster-config.yaml`)
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: get-converted-exams-cluster
  region: us-west-2
  version: "1.28"

# IAM settings with OIDC
iam:
  withOIDC: true
  serviceAccounts:
  - metadata:
      name: aws-load-balancer-controller
      namespace: kube-system
    wellKnownPolicies:
      awsLoadBalancerController: true

# VPC Configuration
vpc:
  enableDnsHostnames: true
  enableDnsSupport: true
  cidr: "10.0.0.0/16"

# Node Groups
nodeGroups:
  - name: worker-nodes
    instanceType: t3.medium
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
```

#### 2. **ECR Integration**

##### ECR Setup Script (`aws-eks/ecr-setup.sh`)
- Creates ECR repository
- Builds and pushes Docker image
- Creates Kubernetes secrets for ECR access
- Sets up lifecycle policies

#### 3. **EKS Deployment Script**

##### Main Deployment (`aws-eks/deploy-eks.sh`)
- Creates EKS cluster (15-20 minutes)
- Installs AWS Load Balancer Controller
- Sets up Cluster Autoscaler
- Deploys application with auto-scaling
- Configures SSL certificates
- Sets up monitoring

#### 4. **Key Components**

##### AWS Load Balancer Controller
- Application Load Balancer (ALB) integration
- SSL termination
- Health checks
- Target group management

##### Cluster Autoscaler
- Automatic node scaling
- Cost optimization
- High availability

##### Monitoring & Logging
- CloudWatch integration
- Container insights
- Application performance monitoring

#### 5. **Production Features**

- **High Availability**: Multi-AZ deployment
- **Auto-scaling**: Both pod and node level
- **Security**: VPC, security groups, IAM roles
- **SSL/TLS**: AWS Certificate Manager integration
- **Monitoring**: CloudWatch and Prometheus
- **Backup**: EBS snapshots and configuration backup

---

## Jenkins CI/CD Pipeline

### Question: "i need the pipeline with jenkins when push the modified code in the github it needs to update the code in the EKS and deploy updated version of the application"

### Solution Provided

#### 1. **Complete CI/CD Pipeline**

##### Jenkins Pipeline (`Jenkinsfile`)
```groovy
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-west-2'
        EKS_CLUSTER_NAME = 'get-converted-exams-cluster'
        ECR_REPOSITORY = 'get-converted-exams'
        APP_NAME = 'get-converted-exams'
        NAMESPACE = 'get-converted-exams'
    }
    
    stages {
        stage('Checkout') { /* Git checkout */ }
        stage('Build Dependencies') { /* Parallel: Rust WASM, Python WASM, Node.js */ }
        stage('Test & Quality Checks') { /* Parallel: Linting, Security scans */ }
        stage('Build Application') { /* React build */ }
        stage('Build & Push Docker Image') { /* ECR push */ }
        stage('Deploy to EKS') { /* Rolling deployment */ }
        stage('Health Check') { /* Application validation */ }
    }
}
```

#### 2. **Jenkins Setup**

##### Installation Script (`jenkins/setup-jenkins.sh`)
- Installs Jenkins on EKS cluster
- Creates service accounts with proper RBAC
- Configures persistent storage
- Sets up LoadBalancer service

##### Credential Configuration (`jenkins/configure-credentials.sh`)
- AWS credentials setup
- GitHub token configuration
- Kubeconfig file management
- Slack integration (optional)

#### 3. **GitHub Integration**

##### Webhook Setup (`jenkins/github-webhook-setup.md`)
- Automatic build triggers
- Pull request integration
- Branch-specific deployments
- Security best practices

#### 4. **Advanced Features**

##### Multi-Environment Support
- `main` branch → Production EKS
- `develop` branch → Staging EKS
- `feature/*` → Development environment

##### Security & Quality
- Docker image vulnerability scanning
- Code linting and quality checks
- Kubernetes manifest validation
- Automated security updates

##### Monitoring & Notifications
- Slack integration for build status
- Email notifications
- Build metrics and trends
- Deployment success/failure alerts

##### Rollback & Recovery
- Automatic rollback on deployment failure
- Manual rollback capabilities
- Build artifact retention
- ECR image cleanup

#### 5. **Pipeline Flow**

```
GitHub Push → Webhook → Jenkins → Build → Test → Docker → ECR → EKS → Health Check → Notify
```

**Detailed Stages:**
1. **Checkout** - Clone code and extract commit info
2. **Build Dependencies** - Rust WASM, Python WASM, Node.js (parallel)
3. **Test & Quality** - Linting, security scans (parallel)
4. **Build Application** - React production build
5. **Docker Build & Push** - Build image and push to ECR
6. **Deploy to EKS** - Rolling deployment with health checks
7. **Health Check** - Verify application is running
8. **Notifications** - Slack alerts for success/failure

---

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. **File Upload Issues**
- **Problem**: Files not uploading or processing
- **Solution**: Check browser console for errors, verify WASM modules are loaded
- **Debug**: Enable verbose logging in browser developer tools

#### 2. **Docker Build Failures**
- **Problem**: Docker build fails during WASM compilation
- **Solution**: Ensure Rust and wasm-pack are properly installed
- **Debug**: Check Dockerfile and build logs

#### 3. **Kubernetes Deployment Issues**
- **Problem**: Pods not starting or crashing
- **Solution**: Check resource limits and node capacity
- **Debug**: `kubectl describe pod` and `kubectl logs`

#### 4. **EKS Access Issues**
- **Problem**: Cannot connect to EKS cluster
- **Solution**: Update kubeconfig and verify AWS credentials
- **Debug**: `aws eks update-kubeconfig` and `kubectl cluster-info`

#### 5. **Jenkins Pipeline Failures**
- **Problem**: Build or deployment failures
- **Solution**: Check Jenkins logs and AWS permissions
- **Debug**: Jenkins console output and AWS CloudTrail

### Debug Commands

#### Kubernetes Debugging
```bash
# Check pod status
kubectl get pods -n get-converted-exams

# Describe pod for events
kubectl describe pod <pod-name> -n get-converted-exams

# Check logs
kubectl logs -f deployment/get-converted-exams -n get-converted-exams

# Check service endpoints
kubectl get endpoints -n get-converted-exams
```

#### Docker Debugging
```bash
# Check running containers
docker ps

# Check container logs
docker logs <container-id>

# Execute into container
docker exec -it <container-id> /bin/bash
```

#### AWS EKS Debugging
```bash
# Update kubeconfig
aws eks update-kubeconfig --name get-converted-exams-cluster --region us-west-2

# Check cluster status
kubectl cluster-info

# Check node status
kubectl get nodes

# Check AWS Load Balancer Controller
kubectl logs -f deployment/aws-load-balancer-controller -n kube-system
```

---

## Best Practices

### 1. **Security**
- Use least privilege IAM roles
- Regularly rotate credentials
- Enable audit logging
- Implement network policies
- Use private ECR repositories

### 2. **Performance**
- Optimize Docker image layers
- Use multi-stage builds
- Implement caching strategies
- Monitor resource usage
- Set appropriate resource limits

### 3. **Reliability**
- Implement health checks
- Use rolling deployments
- Set up monitoring alerts
- Configure auto-scaling
- Plan for disaster recovery

### 4. **Development**
- Use feature branches
- Implement code reviews
- Automate testing
- Document changes
- Follow semantic versioning

### 5. **Operations**
- Monitor application metrics
- Set up log aggregation
- Implement alerting
- Regular backup procedures
- Capacity planning

---

## Future Enhancements

### 1. **Technical Improvements**
- [ ] OCR integration for better document analysis
- [ ] Advanced image enhancement features
- [ ] Progressive Web App (PWA) support
- [ ] Multi-language support
- [ ] Offline processing capabilities

### 2. **Feature Additions**
- [ ] More exam formats (State PSCs, Banking exams)
- [ ] Batch processing optimization
- [ ] Document templates
- [ ] User accounts and history
- [ ] API for third-party integration

### 3. **Infrastructure**
- [ ] Multi-region deployment
- [ ] CDN integration
- [ ] Advanced monitoring
- [ ] Cost optimization
- [ ] Compliance certifications

### 4. **User Experience**
- [ ] Mobile app development
- [ ] Improved UI/UX design
- [ ] Tutorial and help system
- [ ] Accessibility improvements
- [ ] Performance optimization

---

## Conclusion

This documentation covers the complete journey of the getConvertedExams.io project from initial development to production deployment on AWS EKS with automated CI/CD pipeline. The solution provides:

- **Scalable Architecture**: WebAssembly-based processing with cloud deployment
- **Automated Deployment**: Complete CI/CD pipeline with Jenkins
- **Production Ready**: High availability, security, and monitoring
- **Developer Friendly**: Comprehensive documentation and troubleshooting guides

The project demonstrates modern web development practices with cutting-edge technologies like WebAssembly, containerization, and cloud-native deployment strategies.

---

**Built with ❤️ using WebAssembly, TypeScript, Python, Rust, Docker, Kubernetes, and AWS**