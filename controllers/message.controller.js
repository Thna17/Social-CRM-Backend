const axios = require('axios');
const { ChannelPage, PageMessage, PageMessageDetail } = require('../models');
const CryptoJS = require('crypto-js');
const redis = require('../config/redis');

exports.getMessages = async (req, res) => {
  try {
    const { pageId } = req.params;
    const cacheKey = `pageMessages:${pageId}`;

    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      return res.json(JSON.parse(cachedMessages));
    }
    
    const page = await ChannelPage.findOne({ 
      where: { page_id: pageId },
      attributes: ['page_access_token'],
      required: true 
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

   
    // const decryptedToken = CryptoJS.AES.decrypt(
    //   page.encrypted_token,
    //   process.env.ENCRYPTION_KEY
    // ).toString(CryptoJS.enc.Utf8);


    const accessToken = page.page_access_token;


    // Fetch messages from Facebook Pages
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${pageId}/conversations`,
      {
        params: {
          platform: 'messenger',
          fields: 'participants,updated_time',
          access_token: accessToken
        }
      }
    );

    const messages = response.data.data;
          // Cache messages for 24 hours (86400 seconds)
    await redis.set(cacheKey, JSON.stringify(messages), 'EX', 86400);


    res.json(messages);

  } catch (error) {
    console.error('Error fetching messages:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch messages',
      details: error.response?.data || error.message
    });
  }
};


  exports.getMessageDetail= async (req, res) => {
    try {
      const { pageId, conversationId } = req.params;
      const cacheKey = `messageDetail:${conversationId}`;
  
      console.log(pageId, conversationId);
      
      // Check Redis cache first
      const cachedMessages = await redis.get(cacheKey);
      if (cachedMessages) {
        return res.json(JSON.parse(cachedMessages));
      }
  
      // Get page access token from database
      const page = await ChannelPage.findOne({
        where: { page_id: pageId },
        attributes: ['page_access_token']
      });
  
      const accessToken = page.page_access_token;
 
      
      // Fetch messages detail from each conversation
      const response = await axios.get(
        `https://graph.facebook.com/v22.0/${conversationId}/messages`,
        {
          params: {
            fields: 'id,message,created_time,from,to',
            access_token: accessToken
          }
        },
      );
      const messages = response.data.data;
  
      // Cache messages for 24 hours (86400 seconds)
      await redis.set(cacheKey, JSON.stringify(messages), 'EX', 86400);

      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch messages', details: error.response?.data || error.message });
    }
  };
  