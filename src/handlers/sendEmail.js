const sesService = require('../services/ses');
const responses = require('../utils/apiResponses');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.EMAILS_TABLE || 'claude-mcp-emails-dev';

/**
 * Handler for sending emails or saving drafts
 */
exports.handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    
    // Validate required fields
    if (!body.to || !body.subject || !body.body) {
      return responses.badRequest('Missing required fields: to, subject, body');
    }
    
    // Check if this is a draft or should be sent immediately
    const isDraft = body.isDraft === true;
    
    // Process the email
    if (isDraft) {
      // Save as draft
      const draftResult = await sesService.saveDraft({
        to: body.to,
        subject: body.subject,
        body: body.body,
        isHtml: body.isHtml || false,
        cc: body.cc || [],
        bcc: body.bcc || []
      });
      
      // Store in DynamoDB for future reference
      const draftItem = {
        id: draftResult.draftId,
        type: 'draft',
        to: draftResult.to,
        subject: draftResult.subject,
        body: draftResult.body,
        isHtml: draftResult.isHtml,
        cc: draftResult.cc,
        bcc: draftResult.bcc,
        createdAt: draftResult.createdAt,
        status: 'draft'
      };
      
      await dynamoDB.put({
        TableName: tableName,
        Item: draftItem
      }).promise();
      
      return responses.created({
        message: 'Email draft saved successfully',
        draftId: draftResult.draftId
      });
    } else {
      // Send email immediately
      const emailResult = await sesService.sendEmail({
        to: body.to,
        subject: body.subject,
        body: body.body,
        isHtml: body.isHtml || false,
        cc: body.cc || [],
        bcc: body.bcc || []
      });
      
      // Store in DynamoDB for record-keeping
      const emailId = uuidv4();
      const emailItem = {
        id: emailId,
        type: 'sent',
        messageId: emailResult.messageId,
        to: Array.isArray(body.to) ? body.to : [body.to],
        subject: body.subject,
        body: body.body,
        isHtml: body.isHtml || false,
        cc: body.cc || [],
        bcc: body.bcc || [],
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
      
      await dynamoDB.put({
        TableName: tableName,
        Item: emailItem
      }).promise();
      
      return responses.success({
        message: 'Email sent successfully',
        emailId: emailId,
        messageId: emailResult.messageId
      });
    }
  } catch (error) {
    console.error('Error in email handler:', error);
    return responses.serverError(error.message);
  }
};
