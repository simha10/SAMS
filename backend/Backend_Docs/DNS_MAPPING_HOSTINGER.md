# Hostinger Domain Integration with Google Cloud Platform

This document provides step-by-step instructions for mapping your Hostinger-purchased domain to Google Cloud Platform services.

## Prerequisites

1. A domain purchased through Hostinger
2. A Google Cloud Platform project
3. Backend deployed to Cloud Run
4. Frontend deployed to Cloud Run or Firebase Hosting

## Backend Domain Mapping (api.yourdomain.com)

### Step 1: Verify Domain Ownership in Google Cloud

1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Credentials"
3. Click "Create Credentials" > "Domain Verification"
4. Add your domain (e.g., yourdomain.com)
5. Follow the verification process (usually involves adding a TXT record)

### Step 2: Configure Custom Domain in Cloud Run

1. Go to Google Cloud Console > Cloud Run
2. Select your backend service
3. Click "Edit & Deploy New Revision"
4. In the "Networking" section, click "Add Custom Domain"
5. Add your custom domain: `api.yourdomain.com`
6. Follow the verification steps

### Step 3: Add DNS Records in Hostinger

1. Log in to your Hostinger account
2. Go to "Domains" > "Manage DNS"
3. Add the following DNS records:

#### For Backend (api.yourdomain.com):
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | ghs.googlehosted.com | 3600 |
| TXT | api | [Google verification token] | 3600 |

Alternatively, if using Cloud Run custom domain mapping:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | api | ghs.googlehosted.com | 3600 |

### Step 4: SSL Certificate Setup

Google Cloud Run automatically provisions SSL certificates for custom domains:
1. The certificate is automatically generated after DNS verification
2. It may take a few minutes to hours for the certificate to be issued
3. Monitor the status in the Cloud Run service settings

## Frontend Domain Mapping

### Option A: Frontend on Cloud Run (app.yourdomain.com)

#### Step 1: Configure Custom Domain in Cloud Run
1. Go to Google Cloud Console > Cloud Run
2. Select your frontend service
3. Click "Edit & Deploy New Revision"
4. In the "Networking" section, click "Add Custom Domain"
5. Add your custom domain: `app.yourdomain.com` or `yourdomain.com`

#### Step 2: Add DNS Records in Hostinger
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | app | ghs.googlehosted.com | 3600 |
| CNAME | @ | ghs.googlehosted.com | 3600 | (for root domain)

### Option B: Frontend on Firebase Hosting (app.yourdomain.com)

#### Step 1: Add Domain to Firebase Hosting
1. Go to Firebase Console
2. Select your project
3. Navigate to "Hosting"
4. Click "Add Custom Domain"
5. Enter your domain: `app.yourdomain.com`

#### Step 2: Add DNS Records in Hostinger
Firebase will provide you with specific DNS records to add. Typically:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | app | 151.101.1.195 | 3600 |
| A | app | 151.101.65.195 | 3600 |
| A | app | 151.101.129.195 | 3600 |
| A | app | 151.101.193.195 | 3600 |
| TXT | app | [Firebase verification token] | 3600 |

For root domain:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 151.101.1.195 | 3600 |
| A | @ | 151.101.65.195 | 3600 |
| A | @ | 151.101.129.195 | 3600 |
| A | @ | 151.101.193.195 | 3600 |
| TXT | @ | [Firebase verification token] | 3600 |

## Verification Steps

### 1. DNS Propagation Check
```bash
# Check A record
nslookup api.yourdomain.com

# Check CNAME record
nslookup -type=CNAME app.yourdomain.com

# Check TXT records
nslookup -type=TXT yourdomain.com
```

### 2. SSL Certificate Verification
```bash
# Check SSL certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
```

### 3. Service Endpoint Testing
```bash
# Test backend health endpoint
curl -v https://api.yourdomain.com/healthz

# Test frontend access
curl -v https://app.yourdomain.com
```

## Troubleshooting

### Common Issues and Solutions

#### 1. DNS Not Resolving
- Wait for DNS propagation (can take up to 48 hours)
- Check DNS records in Hostinger panel
- Use online DNS checkers like dnschecker.org

#### 2. SSL Certificate Not Issuing
- Ensure DNS records are correctly set
- Check domain verification in Google Cloud
- Wait for automatic SSL provisioning

#### 3. Mixed Content Issues
- Ensure all resources use HTTPS
- Update application configuration to use HTTPS URLs
- Check for hardcoded HTTP URLs in your code

#### 4. CORS Issues
- Update CORS configuration in backend to include your custom domain
- Ensure frontend and backend domains are properly configured

### Hostinger-Specific Troubleshooting

#### 1. DNS Management
- Hostinger uses a simple DNS management interface
- Changes usually propagate within 1-4 hours
- Contact Hostinger support if changes aren't propagating

#### 2. Domain Verification
- Hostinger may require manual verification for certain DNS changes
- Check email for verification requests

## Security Considerations

### 1. DNS Security
- Enable DNSSEC if supported by Hostinger
- Use strong passwords for Hostinger account
- Enable two-factor authentication

### 2. SSL/TLS
- Google Cloud Run provides automatic SSL management
- Certificates are automatically renewed
- Monitor certificate expiration dates

### 3. Domain Protection
- Enable domain locking in Hostinger
- Keep contact information updated
- Monitor for unauthorized DNS changes

## Monitoring and Maintenance

### 1. Regular Checks
- Monitor DNS resolution
- Check SSL certificate expiration
- Verify service availability

### 2. Updates
- Update DNS records when Cloud Run URLs change
- Renew domain registration before expiration
- Update security settings as needed

### 3. Backup
- Keep a record of all DNS settings
- Document domain verification tokens
- Maintain contact information backups

## Example Configuration

For a domain `example.com`:

### Backend: api.example.com
- Points to Cloud Run service
- Uses CNAME record to ghs.googlehosted.com
- Automatic SSL certificate

### Frontend: app.example.com
- Points to Cloud Run or Firebase Hosting
- Uses CNAME record to ghs.googlehosted.com (Cloud Run) or A records (Firebase)
- Automatic SSL certificate

### Root Domain: example.com
- Can point to frontend service
- Uses A records or CNAME depending on hosting platform
- Requires specific configuration for root domains