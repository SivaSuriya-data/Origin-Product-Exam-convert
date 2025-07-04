// Jenkins Pipeline Shared Library for AWS EKS Deployments

def buildDockerImage(String imageName, String imageTag) {
    """
    Build Docker image with proper tagging
    """
    sh """
        docker build -t ${imageName}:${imageTag} .
        docker tag ${imageName}:${imageTag} ${imageName}:latest
    """
}

def pushToECR(String ecrRepository, String imageTag, String awsRegion, String awsAccountId) {
    """
    Push Docker image to Amazon ECR
    """
    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
        sh """
            # Login to ECR
            aws ecr get-login-password --region ${awsRegion} | \
                docker login --username AWS --password-stdin ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com
            
            # Tag and push image
            docker tag ${ecrRepository}:${imageTag} ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${ecrRepository}:${imageTag}
            docker tag ${ecrRepository}:${imageTag} ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${ecrRepository}:latest
            
            docker push ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${ecrRepository}:${imageTag}
            docker push ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${ecrRepository}:latest
        """
    }
}

def deployToEKS(String clusterName, String namespace, String appName, String imageUri, String awsRegion) {
    """
    Deploy application to AWS EKS cluster
    """
    withCredentials([
        [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials'],
        file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_FILE')
    ]) {
        sh """
            # Setup kubectl
            export KUBECONFIG=\${KUBECONFIG_FILE}
            
            # Update kubeconfig for EKS
            aws eks update-kubeconfig --region ${awsRegion} --name ${clusterName}
            
            # Verify cluster connection
            kubectl cluster-info
            
            # Update deployment
            kubectl set image deployment/${appName} ${appName}=${imageUri} -n ${namespace}
            
            # Wait for rollout
            kubectl rollout status deployment/${appName} -n ${namespace} --timeout=600s
        """
    }
}

def runSecurityScan(String imageName) {
    """
    Run security scan on Docker image
    """
    sh """
        # Run Trivy security scan
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy:latest image ${imageName}
    """
}

def sendSlackNotification(String channel, String color, String message) {
    """
    Send notification to Slack
    """
    slackSend(
        channel: channel,
        color: color,
        message: message
    )
}

def getCommitInfo() {
    """
    Get Git commit information
    """
    def commitId = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
    def commitMessage = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
    def commitAuthor = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
    
    return [
        id: commitId,
        message: commitMessage,
        author: commitAuthor,
        shortId: commitId.take(7)
    ]
}

def validateKubernetesManifests(String manifestPath) {
    """
    Validate Kubernetes manifests
    """
    sh """
        # Validate YAML syntax
        find ${manifestPath} -name '*.yaml' -o -name '*.yml' | xargs -I {} sh -c 'echo "Validating {}" && kubectl --dry-run=client apply -f {}'
    """
}

def performHealthCheck(String endpoint, int retries = 5, int delay = 30) {
    """
    Perform health check on deployed application
    """
    script {
        for (int i = 0; i < retries; i++) {
            try {
                sh "curl -f ${endpoint}/health"
                echo "✅ Health check passed"
                return true
            } catch (Exception e) {
                echo "⚠️ Health check failed, attempt ${i + 1}/${retries}"
                if (i < retries - 1) {
                    sleep(delay)
                }
            }
        }
        error("❌ Health check failed after ${retries} attempts")
    }
}

def rollbackDeployment(String namespace, String deploymentName) {
    """
    Rollback deployment to previous version
    """
    withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_FILE')]) {
        sh """
            export KUBECONFIG=\${KUBECONFIG_FILE}
            kubectl rollout undo deployment/${deploymentName} -n ${namespace}
            kubectl rollout status deployment/${deploymentName} -n ${namespace}
        """
    }
}

def cleanupOldImages(String ecrRepository, int keepCount = 10) {
    """
    Cleanup old ECR images
    """
    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
        sh """
            # Get image digests sorted by date
            aws ecr describe-images --repository-name ${ecrRepository} \
                --query 'sort_by(imageDetails,&imagePushedAt)[:-${keepCount}].[imageDigest]' \
                --output text | while read digest; do
                if [ ! -z "\$digest" ]; then
                    echo "Deleting image with digest: \$digest"
                    aws ecr batch-delete-image --repository-name ${ecrRepository} \
                        --image-ids imageDigest=\$digest
                fi
            done
        """
    }
}

return this