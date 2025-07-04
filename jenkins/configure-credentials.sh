#!/bin/bash

# Script to configure Jenkins credentials via CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Configuring Jenkins Credentials${NC}"

# Configuration
JENKINS_NAMESPACE="jenkins"
JENKINS_URL="http://localhost:8080"  # Update with your Jenkins URL
JENKINS_USER="admin"

# Get Jenkins password
JENKINS_PASSWORD=$(kubectl get secret jenkins -n $JENKINS_NAMESPACE -o jsonpath="{.data.jenkins-admin-password}" | base64 --decode)

echo -e "${YELLOW}📋 Jenkins Credentials Setup${NC}"
echo "Please provide the following credentials:"

# AWS Credentials
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo
read -p "AWS Account ID: " AWS_ACCOUNT_ID

# GitHub Token
read -s -p "GitHub Personal Access Token: " GITHUB_TOKEN
echo

# Slack Token (optional)
read -s -p "Slack Bot Token (optional): " SLACK_TOKEN
echo

# Create credentials XML files
mkdir -p /tmp/jenkins-credentials

# AWS Credentials
cat > /tmp/jenkins-credentials/aws-credentials.xml <<EOF
<com.cloudbees.jenkins.plugins.awscredentials.AWSCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>aws-credentials</id>
  <description>AWS Credentials for EKS Deployment</description>
  <accessKey>$AWS_ACCESS_KEY_ID</accessKey>
  <secretKey>$AWS_SECRET_ACCESS_KEY</secretKey>
</com.cloudbees.jenkins.plugins.awscredentials.AWSCredentialsImpl>
EOF

# AWS Account ID
cat > /tmp/jenkins-credentials/aws-account-id.xml <<EOF
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>aws-account-id</id>
  <description>AWS Account ID</description>
  <secret>$AWS_ACCOUNT_ID</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF

# GitHub Token
cat > /tmp/jenkins-credentials/github-token.xml <<EOF
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>github-token</id>
  <description>GitHub Personal Access Token</description>
  <secret>$GITHUB_TOKEN</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF

# Slack Token (if provided)
if [ ! -z "$SLACK_TOKEN" ]; then
cat > /tmp/jenkins-credentials/slack-token.xml <<EOF
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>slack-token</id>
  <description>Slack Bot Token</description>
  <secret>$SLACK_TOKEN</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF
fi

echo -e "${YELLOW}📤 Uploading credentials to Jenkins...${NC}"

# Port forward to Jenkins
kubectl port-forward svc/jenkins -n $JENKINS_NAMESPACE 8080:8080 &
PORT_FORWARD_PID=$!

# Wait for port forward to be ready
sleep 5

# Function to create credential
create_credential() {
    local cred_file=$1
    local cred_id=$2
    
    curl -X POST \
        -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        -H "Content-Type: application/xml" \
        -d @"$cred_file" \
        "$JENKINS_URL/credentials/store/system/domain/_/createCredentials"
    
    echo -e "${GREEN}✅ Created credential: $cred_id${NC}"
}

# Create credentials
create_credential "/tmp/jenkins-credentials/aws-credentials.xml" "aws-credentials"
create_credential "/tmp/jenkins-credentials/aws-account-id.xml" "aws-account-id"
create_credential "/tmp/jenkins-credentials/github-token.xml" "github-token"

if [ ! -z "$SLACK_TOKEN" ]; then
    create_credential "/tmp/jenkins-credentials/slack-token.xml" "slack-token"
fi

# Kill port forward
kill $PORT_FORWARD_PID

# Cleanup
rm -rf /tmp/jenkins-credentials

echo -e "${GREEN}🎉 Jenkins credentials configured successfully!${NC}"
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "1. Create a new Pipeline job in Jenkins"
echo -e "2. Configure GitHub webhook"
echo -e "3. Set up Slack notifications (if configured)"