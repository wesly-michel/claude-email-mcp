const zohoMailService = require('../services/zohoMail');
const responses = require('../utils/apiResponses');
const AWS = require('aws-sdk');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.EMAILS_TABLE || 'claude-mcp-emails-dev';

/**
 * Handler for getting email drafts
 */
exports.handler = async (event) => {
  try {
    const source = event.queryStringParameters?.source || 'local';
    const limit = parseInt(event.queryStringParameters?.limit || '10', 10);
    
    // If source is 'zoho', fetch from Zoho Mail API
    if (source === 'zoho') {
      const drafts = await zohoMailService.getDrafts(limit);
      
      // Transform the response to a standardized format
      const formattedDrafts = drafts.map(draft => ({
        id: draft.messageId,
        subject: draft.subject,
        to: draft.toAddress.map(addr => addr.address),
        createdAt: draft.receivedTime,
        snippet: draft.snippet,
        source: 'zoho'
      }));
      
      return responses.success({
        drafts: formattedDrafts,
        count: formattedDrafts.length,
        source: 'zoho'
      });
    } 
    // Otherwise, fetch from our local DynamoDB
    else {
      // Query DynamoDB for drafts
      const result = await dynamoDB.query({
        TableName: tableName,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':type': 'draft'
        },
        Limit: limit,
        ScanIndexForward: false // to get most recent first
      }).promise();
      
      return responses.success({
        drafts: result.Items,
        count: result.Count,
        source: 'local'
      });
    }
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return responses.serverError(error.message);
  }
};
