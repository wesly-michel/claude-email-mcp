# Claude Email MCP

A Message Control Protocol (MCP) that allows Claude to send emails on your behalf using Amazon SES and read emails via Zoho Mail API.

## Features

- Send emails via Amazon SES
- Save email drafts for later review
- Retrieve and read unread emails from Zoho Mail
- Secure API key authentication
- DynamoDB for storing email metadata

## Prerequisites

- AWS Account
- Node.js 14.x or later
- Serverless Framework
- Zoho Mail account with API access
- Amazon SES verified domain

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd claude-email-mcp
npm install
```

### 2. Configure Secrets

Create a secret in AWS Secrets Manager with the following structure:

```json
{
  "apiKey": "your-api-key-for-claude",
  "emailFrom": "your-verified@email.com",
  "zohoRefreshToken": "your-zoho-refresh-token",
  "zohoClientId": "your-zoho-client-id",
  "zohoClientSecret": "your-zoho-client-secret",
  "zohoAccountId": "your-zoho-account-id"
}
```

Name the secret `claude-mcp-secrets-dev` for dev environment or `claude-mcp-secrets-prod` for production.

### 3. Store API Key in Parameter Store

Store your API key in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter --name /claude-mcp/api-key-dev --type SecureString --value "your-api-key"
```

### 4. Deploy the MCP

```bash
# Deploy to dev environment
npm run deploy

# Or deploy to production
npm run deploy:prod
```

### 5. Note the API Gateway endpoints

After deployment, the Serverless Framework will output the API Gateway endpoints. You'll need these to configure Claude to use the MCP.

## API Reference

### Send Email

**Endpoint:** POST /email

**Headers:**
- x-api-key: Your API Key

**Request Body:**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Email Subject",
  "body": "Email content",
  "isHtml": false,
  "cc": [],
  "bcc": [],
  "isDraft": false
}
```

**Response:**
```json
{
  "message": "Email sent successfully",
  "emailId": "uuid",
  "messageId": "ses-message-id"
}
```

### Get Drafts

**Endpoint:** GET /drafts

**Headers:**
- x-api-key: Your API Key

**Query Parameters:**
- source: "local" or "zoho" (default: "local")
- limit: Number of drafts to retrieve (default: 10)

**Response:**
```json
{
  "drafts": [
    {
      "id": "draft-id",
      "subject": "Draft Subject",
      "to": ["recipient@example.com"],
      "createdAt": "2023-08-22T14:30:00Z",
      "body": "Draft content"
    }
  ],
  "count": 1,
  "source": "local"
}
```

### Get Unread Emails

**Endpoint:** GET /emails/unread

**Headers:**
- x-api-key: Your API Key

**Query Parameters:**
- limit: Number of emails to retrieve (default: 10)
- content: Whether to fetch full email content (default: false)

**Response:**
```json
{
  "emails": [
    {
      "id": "email-id",
      "subject": "Email Subject",
      "from": [
        {
          "name": "Sender Name",
          "email": "sender@example.com"
        }
      ],
      "to": [
        {
          "name": "Recipient Name",
          "email": "recipient@example.com"
        }
      ],
      "receivedTime": "2023-08-22T14:30:00Z",
      "snippet": "Beginning of email...",
      "hasAttachments": false,
      "isUnread": true,
      "content": "Full email content", // Only if content=true
      "contentType": "text/plain" // Only if content=true
    }
  ],
  "count": 1
}
```

## Using with Claude

To use this MCP with Claude, you'll need to provide Claude with:

1. The API Gateway endpoints
2. The API key for authentication
3. Instructions on how to format requests

Example instruction to Claude:

```
You can send emails on my behalf using the following MCP:

- Send Email: POST https://your-api-gateway.amazonaws.com/dev/email 
- Get Drafts: GET https://your-api-gateway.amazonaws.com/dev/drafts
- Get Unread Emails: GET https://your-api-gateway.amazonaws.com/dev/emails/unread

Please use this API key in the x-api-key header: your-api-key

When I ask you to send an email, please format it properly and send it to the specified recipients.
```

## Development

For local development, you can use the serverless-offline plugin:

```bash
npm run offline
```

This will start a local server that emulates API Gateway and Lambda.

## Security Considerations

- Keep your API key and secrets secure
- Use IAM roles with least privilege
- Consider adding rate limiting
- Implement logging and monitoring
- Regularly rotate credentials

## License

MIT
