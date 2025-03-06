const zohoMailService = require('../services/zohoMail');
const responses = require('../utils/apiResponses');

/**
 * Handler for getting unread emails
 */
exports.handler = async (event) => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '10', 10);
    const fetchContent = event.queryStringParameters?.content === 'true';
    
    // Fetch unread emails from Zoho Mail API
    const unreadEmails = await zohoMailService.getUnreadEmails(limit);
    
    // Format the response
    let formattedEmails = unreadEmails.map(email => ({
      id: email.messageId,
      subject: email.subject,
      from: email.fromAddress.map(addr => ({ name: addr.name, email: addr.address })),
      to: email.toAddress.map(addr => ({ name: addr.name, email: addr.address })),
      receivedTime: email.receivedTime,
      snippet: email.snippet,
      hasAttachments: email.hasAttachment,
      isUnread: email.isUnread
    }));
    
    // If content is requested, fetch the full content for each email
    if (fetchContent && formattedEmails.length > 0) {
      const emailsWithContent = await Promise.all(
        formattedEmails.map(async (email) => {
          try {
            const details = await zohoMailService.getEmailDetails(email.id);
            return {
              ...email,
              content: details.content,
              contentType: details.contentType
            };
          } catch (error) {
            console.error(`Error fetching content for email ${email.id}:`, error);
            return email; // Return without content if there was an error
          }
        })
      );
      
      formattedEmails = emailsWithContent;
    }
    
    return responses.success({
      emails: formattedEmails,
      count: formattedEmails.length
    });
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    return responses.serverError(error.message);
  }
};
