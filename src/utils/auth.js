const AWS = require('aws-sdk');

// Cache for secrets to avoid frequent calls to Secrets Manager
let secretsCache = null;
let secretsLastFetched = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get secrets from AWS Secrets Manager
 */
const getSecrets = async () => {
  // Check if we have a valid cache
  if (secretsCache && secretsLastFetched && (Date.now() - secretsLastFetched) < CACHE_TTL) {
    return secretsCache;
  }

  const secretsManager = new AWS.SecretsManager();
  const secretName = process.env.SECRETS_NAME;

  try {
    const data = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();
    
    // Parse and cache the secret
    secretsCache = JSON.parse(data.SecretString);
    secretsLastFetched = Date.now();
    
    return secretsCache;
  } catch (error) {
    console.error(`Error retrieving secrets from ${secretName}:`, error);
    throw new Error('Failed to retrieve secrets');
  }
};

/**
 * API Gateway authorizer function
 */
const authorize = async (event, context) => {
  const apiKey = event.authorizationToken;
  
  try {
    // Get the API key from Secrets Manager
    const secrets = await getSecrets();
    const storedApiKey = secrets.apiKey;
    
    if (apiKey && apiKey === storedApiKey) {
      return generatePolicy('user', 'Allow', event.methodArn);
    } else {
      return generatePolicy('user', 'Deny', event.methodArn);
    }
  } catch (error) {
    console.error('Error in auth:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

/**
 * Generate IAM policy for API Gateway authorizer
 */
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {
    principalId: principalId
  };
  
  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    };
    authResponse.policyDocument = policyDocument;
  }
  
  return authResponse;
};

module.exports = {
  getSecrets,
  authorize
};
