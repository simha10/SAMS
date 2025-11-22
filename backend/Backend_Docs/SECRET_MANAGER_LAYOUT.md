# Secret Manager Variable Layout for SAMS

This document describes the required secrets for the SAMS application when deployed to Google Cloud Platform.

## Required Secrets

### 1. MongoDB Connection URI
- **Name**: `sams-mongodb-uri`
- **Key**: `uri`
- **Description**: MongoDB connection string with authentication credentials
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 2. JWT Secret
- **Name**: `sams-jwt-secret`
- **Key**: `secret`
- **Description**: Secret key used to sign JWT tokens
- **Requirements**: 
  - Minimum 32 characters
  - Should contain alphanumeric characters and special characters
  - Must be kept secure and never exposed

### 3. Application Secrets (Optional but Recommended)

#### Refresh Token Secret (Optional)
- **Name**: `sams-refresh-secret`
- **Key**: `secret`
- **Description**: Separate secret for signing refresh tokens (if using asymmetric signing)

#### Encryption Keys (Optional)
- **Name**: `sams-encryption-key`
- **Key**: `key`
- **Description**: Key used for encrypting sensitive data at rest

## Secret Creation Commands

To create these secrets in Google Secret Manager, use the following gcloud commands:

```bash
# Create MongoDB URI secret
echo -n "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority" | \
gcloud secrets create sams-mongodb-uri --data-file=-

# Create JWT secret
echo -n "your-super-secret-jwt-key-min-32-chars" | \
gcloud secrets create sams-jwt-secret --data-file=-

# Add IAM policy binding for Cloud Run service
gcloud secrets add-iam-policy-binding sams-mongodb-uri \
    --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding sams-jwt-secret \
    --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Environment Variables Mapping

The application expects the following environment variables that reference these secrets:

| Environment Variable | Secret Reference                     | Purpose                   |
|----------------------|--------------------------------------|---------------------------|
| MONGO_URI            | secret://sams-mongodb-uri#uri        | Database connection       |
| JWT_SECRET           | secret://sams-jwt-secret#secret      | JWT token signing         |

## Security Best Practices

1. **Rotation**: Rotate secrets periodically (JWT secret every 90 days)
2. **Access Control**: Limit access to secrets using least privilege principle
3. **Audit**: Enable audit logging for secret access
4. **Backup**: Maintain secure backups of critical secrets
5. **Environment Separation**: Use separate secrets for development, staging, and production

## Secret Update Process

1. Create a new version of the secret:
   ```bash
   echo -n "new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-
   ```

2. Deploy new application version that uses the updated secret

3. Verify the application is working correctly

4. Destroy old secret versions after confirmation:
   ```bash
   gcloud secrets versions destroy SECRET_NAME --version=OLD_VERSION
   ```