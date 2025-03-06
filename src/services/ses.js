const AWS = require('aws-sdk');
const { getSecrets } = require('../utils/auth');

class SESService {
  constructor() {
    this.ses = new AWS.SES({ 
      region: process.env.SES_REGION || 'us-east-1'
    });
    this.initialized = false;
    this.fromAddress = null;
  }

  async init() {
    if (!this.initialized) {
      const secrets = await getSecrets();
      this.fromAddress = secrets.emailFrom || 'no-reply@yourdomain.com';
      this.initialized = true;
    }
  }

  async sendEmail({ to, subject, body, isHtml = false, cc = [], bcc = [] }) {
    await this.init();

    const params = {
      Source: this.fromAddress,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
        CcAddresses: cc,
        BccAddresses: bcc
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          ...(isHtml ? {
            Html: {
              Data: body,
              Charset: 'UTF-8'
            }
          } : {
            Text: {
              Data: body,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      return { 
        success: true, 
        messageId: result.MessageId 
      };
    } catch (error) {
      console.error('Error sending email via SES:', error);
      throw error;
    }
  }

  async saveDraft({ to, subject, body, isHtml = false, cc = [], bcc = [] }) {
    // Here we'd typically save to DynamoDB, but in this implementation
    // we'll use the same structure as sending, just with a different method call
    await this.init();
    
    // Return a draft ID - in a full implementation this would be stored 
    // with the draft content in DynamoDB
    return {
      success: true,
      draftId: `draft-${Date.now()}`,
      to: Array.isArray(to) ? to : [to],
      subject,
      body,
      isHtml,
      cc,
      bcc,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = new SESService();
