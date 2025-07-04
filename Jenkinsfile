pipeline {
    agent any
    
    environment {
        // AWS Configuration
        AWS_REGION = 'us-west-2'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        EKS_CLUSTER_NAME = 'get-converted-exams-cluster'
        ECR_REPOSITORY = 'get-converted-exams'
        
        // Application Configuration
        APP_NAME = 'get-converted-exams'
        NAMESPACE = 'get-converted-exams'
        
        // Docker Configuration
        DOCKER_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
        IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
        
        // Credentials
        AWS_CREDENTIALS = credentials('aws-credentials')
        GITHUB_CREDENTIALS = credentials('github-token')
        KUBECONFIG_CREDENTIAL = credentials('kubeconfig-file')
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        skipStagesAfterUnstable()
    }
    
    triggers {
        githubPush()
        pollSCM('H/5 * * * *') // Poll every 5 minutes as backup
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Checking out code from GitHub..."
                    checkout scm
                    
                    // Get commit information
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    echo "📝 Commit: ${env.GIT_COMMIT}"
                    echo "💬 Message: ${env.GIT_COMMIT_MSG}"
                }
            }
        }
        
        stage('Build Dependencies') {
            parallel {
                stage('Build Rust WASM') {
                    steps {
                        script {
                            echo "🦀 Building Rust WASM module..."
                            sh '''
                                cd rust-formatter
                                # Remove existing Cargo.lock to avoid version conflicts
                                rm -f Cargo.lock
                                # Build WASM module
                                wasm-pack build --target web --out-dir pkg
                            '''
                        }
                    }
                }
                
                stage('Build Python WASM') {
                    steps {
                        script {
                            echo "🐍 Building Python WASM components..."
                            sh '''
                                python3 scripts/build_python_wasm.py
                            '''
                        }
                    }
                }
                
                stage('Install Node Dependencies') {
                    steps {
                        script {
                            echo "📦 Installing Node.js dependencies..."
                            dir('Get-Converted-Exams') {
                                sh '''
                                    npm ci --production=false
                                '''
                            }
                        }
                    }
                }
            }
        }
        
        stage('Test & Quality Checks') {
            parallel {
                stage('Lint Code') {
                    steps {
                        script {
                            echo "🔍 Running code linting..."
                            dir('Get-Converted-Exams') {
                                sh '''
                                    npm run lint
                                '''
                            }
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        script {
                            echo "🔒 Running security scan..."
                            sh '''
                                # Scan for vulnerabilities
                                npm audit --audit-level moderate
                                
                                # Scan Docker base image
                                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                    -v $(pwd):/app aquasec/trivy:latest fs /app
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    echo "🏗️ Building React application..."
                    dir('Get-Converted-Exams') {
                        sh '''
                            npm run build
                        '''
                    }
                }
            }
        }
        
        stage('Build & Push Docker Image') {
            steps {
                script {
                    echo "🐳 Building and pushing Docker image..."
                    
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                    credentialsId: 'aws-credentials']]) {
                        sh '''
                            # Login to ECR
                            aws ecr get-login-password --region ${AWS_REGION} | \
                                docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            # Build Docker image
                            docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:${IMAGE_TAG}
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                            
                            # Push to ECR
                            docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                            docker push ${DOCKER_IMAGE}:latest
                            
                            echo "✅ Image pushed: ${DOCKER_IMAGE}:${IMAGE_TAG}"
                        '''
                    }
                }
            }
        }
        
        stage('Deploy to EKS') {
            steps {
                script {
                    echo "🚀 Deploying to AWS EKS..."
                    
                    withCredentials([
                        [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials'],
                        file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_FILE')
                    ]) {
                        sh '''
                            # Setup kubectl
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            
                            # Update kubeconfig for EKS
                            aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}
                            
                            # Verify cluster connection
                            kubectl cluster-info
                            
                            # Update deployment with new image
                            kubectl set image deployment/${APP_NAME} \
                                ${APP_NAME}=${DOCKER_IMAGE}:${IMAGE_TAG} \
                                -n ${NAMESPACE}
                            
                            # Wait for rollout to complete
                            kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=600s
                            
                            # Verify deployment
                            kubectl get pods -n ${NAMESPACE}
                            kubectl get services -n ${NAMESPACE}
                        '''
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "🏥 Performing health checks..."
                    
                    withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_FILE')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            
                            # Check pod health
                            kubectl get pods -n ${NAMESPACE} -l app=${APP_NAME}
                            
                            # Check if all pods are ready
                            kubectl wait --for=condition=ready pod -l app=${APP_NAME} -n ${NAMESPACE} --timeout=300s
                            
                            # Get service endpoint
                            EXTERNAL_IP=$(kubectl get ingress ${APP_NAME}-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}\' 2>/dev/null || echo "Not configured")
                            echo "🌐 Application endpoint: ${EXTERNAL_IP}"
                            
                            # Basic health check
                            if [ "$EXTERNAL_IP" != "Not configured" ]; then
                                echo "⏳ Waiting for application to be ready..."
                                sleep 30
                                curl -f http://${EXTERNAL_IP}/health || echo "Health check endpoint not available"
                            fi
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up..."
                sh '''
                    # Clean up Docker images
                    docker image prune -f
                    
                    # Clean up build artifacts
                    rm -rf node_modules/.cache
                '''
            }
        }
        
        success {
            script {
                echo "✅ Pipeline completed successfully!"
                
                // Send success notification
                slackSend(
                    channel: '#deployments',
                    color: 'good',
                    message: """
                        ✅ *Deployment Successful*
                        
                        *Application:* ${APP_NAME}
                        *Environment:* EKS Production
                        *Image:* ${DOCKER_IMAGE}:${IMAGE_TAG}
                        *Commit:* ${env.GIT_COMMIT.take(7)}
                        *Message:* ${env.GIT_COMMIT_MSG}
                        *Build:* ${BUILD_NUMBER}
                        *Duration:* ${currentBuild.durationString}
                    """
                )
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                
                // Send failure notification
                slackSend(
                    channel: '#deployments',
                    color: 'danger',
                    message: """
                        ❌ *Deployment Failed*
                        
                        *Application:* ${APP_NAME}
                        *Environment:* EKS Production
                        *Commit:* ${env.GIT_COMMIT.take(7)}
                        *Build:* ${BUILD_NUMBER}
                        *Stage:* ${env.STAGE_NAME}
                        *Duration:* ${currentBuild.durationString}
                        
                        Please check the build logs for details.
                    """
                )
            }
        }
        
        unstable {
            script {
                echo "⚠️ Pipeline completed with warnings!"
            }
        }
    }
}