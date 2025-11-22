const logger = require('./logger');

/**
 * Load secret from GCP Secret Manager or fallback to environment variable
 * @param {string} secretName - Name of the secret
 * @param {string} envVar - Environment variable name as fallback
 * @returns {Promise<string>} - Secret value
 */
async function loadSecret(secretName, envVar) {
  // If not using Secret Manager, fallback to environment variable
  if (process.env.USE_SECRET_MANAGER !== 'true') {
    logger.debug(`Using environment variable for ${secretName}`);
    return process.env[envVar] || '';
  }

  try {
    // Try to load from GCP Secret Manager
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
    if (!projectId) {
      logger.warn('GCP Project ID not found, falling back to environment variable');
      return process.env[envVar] || '';
    }

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload.data.toString('utf8');
    
    logger.info(`Successfully loaded secret ${secretName} from Secret Manager`);
    return payload;
  } catch (error) {
    logger.error(`Failed to load secret ${secretName} from Secret Manager:`, error);
    logger.info(`Falling back to environment variable ${envVar}`);
    return process.env[envVar] || '';
  }
}

/**
 * Initialize all required secrets
 */
async function initializeSecrets() {
  logger.info('Initializing secrets...');
  
  // Load MongoDB URI
  process.env.MONGO_URI = await loadSecret('sams-mongodb-uri', 'MONGO_URI');
  
  // Load JWT Secret
  process.env.JWT_SECRET = await loadSecret('sams-jwt-secret', 'JWT_SECRET');
  
  logger.info('Secrets initialization completed');
}

module.exports = {
  loadSecret,
  initializeSecrets
};