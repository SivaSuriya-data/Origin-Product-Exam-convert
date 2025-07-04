# GitHub Webhook Setup for Jenkins CI/CD

This guide explains how to set up GitHub webhooks to trigger Jenkins builds automatically when code is pushed.

## 🔧 Prerequisites

- Jenkins server accessible from the internet
- GitHub repository with admin access
- GitHub Personal Access Token configured in Jenkins

## 📝 Step-by-Step Setup

### 1. Get Jenkins Webhook URL

Your Jenkins webhook URL will be:
```
http://your-jenkins-url:8080/github-webhook/
```

### 2. Configure GitHub Webhook

1. **Go to your GitHub repository**
   - Navigate to `Settings` → `Webhooks`
   - Click `Add webhook`

2. **Configure Webhook Settings**
   - **Payload URL**: `http://your-jenkins-url:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: Leave empty (or add if you want extra security)
   - **SSL verification**: Enable if using HTTPS

3. **Select Events**
   - Choose `Just the push event` for basic CI/CD
   - Or select `Let me select individual events` for more control:
     - ✅ Push events
     - ✅ Pull request events
     - ✅ Release events

4. **Activate Webhook**
   - Ensure `Active` is checked
   - Click `Add webhook`

### 3. Configure Jenkins Job

1. **Create New Pipeline Job**
   - Go to Jenkins dashboard
   - Click `New Item`
   - Enter job name: `get-converted-exams-pipeline`
   - Select `Pipeline`
   - Click `OK`

2. **Configure Pipeline Settings**

   **General Tab:**
   - ✅ GitHub project
   - Project url: `https://github.com/your-username/your-repo`

   **Build Triggers:**
   - ✅ GitHub hook trigger for GITScm polling

   **Pipeline:**
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/your-username/your-repo.git`
   - Credentials: Select your GitHub token
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile`

3. **Save Configuration**

### 4. Test the Setup

1. **Manual Test**
   - Go to your Jenkins job
   - Click `Build Now`
   - Check console output for any issues

2. **Webhook Test**
   - Make a small change to your repository
   - Commit and push to the main branch
   - Check if Jenkins job triggers automatically

### 5. Webhook Security (Optional)

For production environments, add webhook security:

1. **Generate Secret**
   ```bash
   openssl rand -hex 20
   ```

2. **Add Secret to GitHub**
   - In webhook settings, add the generated secret

3. **Configure Jenkins**
   - Install `GitHub Integration Plugin`
   - Add webhook secret in Jenkins global configuration

## 🔍 Troubleshooting

### Common Issues

1. **Webhook not triggering**
   - Check Jenkins is accessible from internet
   - Verify webhook URL is correct
   - Check GitHub webhook delivery logs

2. **Authentication errors**
   - Verify GitHub token has correct permissions
   - Check Jenkins credentials configuration

3. **Build failures**
   - Check Jenkins console logs
   - Verify AWS credentials are configured
   - Ensure EKS cluster is accessible

### Webhook Delivery Logs

Check webhook delivery in GitHub:
1. Go to repository `Settings` → `Webhooks`
2. Click on your webhook
3. Check `Recent Deliveries` tab
4. Look for successful (200) responses

## 📊 Advanced Configuration

### Multi-Branch Pipeline

For more advanced setups with multiple branches:

1. **Create Multi-branch Pipeline**
   - New Item → Multibranch Pipeline
   - Configure branch sources (GitHub)
   - Set up branch discovery strategies

2. **Branch-specific Deployments**
   - `main` branch → Production EKS
   - `develop` branch → Staging EKS
   - Feature branches → Development EKS

### Pull Request Builds

To build pull requests:

1. **GitHub Branch Source Configuration**
   - Enable "Discover pull requests from origin"
   - Set merge strategy

2. **Jenkinsfile Modifications**
   ```groovy
   when {
       anyOf {
           branch 'main'
           changeRequest()
       }
   }
   ```

## 🚀 Best Practices

1. **Use Branch Protection**
   - Require status checks to pass
   - Require pull request reviews
   - Restrict pushes to main branch

2. **Parallel Builds**
   - Use Jenkins agents for parallel execution
   - Separate build and deploy stages

3. **Notifications**
   - Configure Slack/email notifications
   - Set up build status badges

4. **Security**
   - Use webhook secrets
   - Limit Jenkins permissions
   - Regularly rotate credentials

## 📱 Monitoring

Monitor your CI/CD pipeline:

1. **Jenkins Dashboard**
   - Build history and trends
   - Pipeline stage view
   - Blue Ocean interface

2. **GitHub Integration**
   - Commit status checks
   - Pull request build status
   - Release automation

3. **AWS CloudWatch**
   - EKS deployment metrics
   - Application performance
   - Error tracking