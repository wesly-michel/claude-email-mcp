const axios = require('axios');
const { getSecrets } = require('../utils/auth');

class ZohoMailService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.clientId = null;
    this.clientSecret = null;
    this.accountId = null;
    this.baseUrl = 'https://mail.zoho.com/api/accounts';
    this.tokenExpiry = null;
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      const secrets = await getSecrets();
      this.refreshToken = secrets.zohoRefreshToken;
      this.clientId = secrets.zohoClientId;
      this.clientSecret = secrets.zohoClientSecret;
      this.accountId = secrets.zohoAccountId;
      this.initialized = true;
    }
  }

  async getAccessToken() {
    // Check if we already have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    await this.init();

    try {
      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry time (typically 1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing Zoho access token:', error.response?.data || error.message);
      throw new Error('Failed to get Zoho access token');
    }
  }

  async getUnreadEmails(limit = 10) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`${this.baseUrl}/${this.accountId}/messages/search`, {
        params: {
          searchKey: 'isUnread',
          searchValue: 'true',
          limit
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching unread emails:', error.response?.data || error.message);
      throw new Error('Failed to fetch unread emails from Zoho');
    }
  }

  async getEmailDetails(messageId) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`${this.baseUrl}/${this.accountId}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching email details:', error.response?.data || error.message);
      throw new Error('Failed to fetch email details from Zoho');
    }
  }

  async markAsRead(messageId) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.put(`${this.baseUrl}/${this.accountId}/messages/${messageId}`, {
        isUnread: false
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error marking email as read:', error.response?.data || error.message);
      throw new Error('Failed to mark email as read in Zoho');
    }
  }

  async getDrafts(limit = 10, offset = 0) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`${this.baseUrl}/${this.accountId}/folders/Drafts/messages`, {
        params: {
          limit,
          offset
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching drafts:', error.response?.data || error.message);
      throw new Error('Failed to fetch drafts from Zoho');
    }
  }
}

module.exports = new ZohoMailService();
