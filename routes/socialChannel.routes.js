// socialChannel.routes.js
const express = require("express");
const passport = require("passport");
const axios = require("axios");
const crypto = require("crypto");
const { FacebookPage, FacebookAccount } = require("../models");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/authenticateToken"); // Adjust path if needed


// Add this function to socialChannel.routes.js
const subscribePageToWebhook = async (pageId, accessToken) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: 'messages,messaging_postbacks',
          access_token: accessToken
        }
      }
    );
    
    console.log('Webhook subscription success:', response.data);
    return true;
  } catch (error) {
    console.error('Subscription failed:', error.response?.data || error.message);
    return false;
  }
};
router.get("/facebook", (req, res, next) => {  

  passport.authenticate("facebook", {
    scope: ["pages_messaging", "pages_show_list"],
    auth_type: "reauthenticate",
    // state: JSON.stringify({ userId: req.user.id }),

  })(req, res, next);
});

router.get(
  "/facebook/callback",
  
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    session: false,
  }),
  
  async (req, res) => {
    try {
      const facebookAccount = req.user;
      console.log(facebookAccount);
  
      // ✅ Redirect to frontend with token in query (optional if cookie is used)
   
      const verifySubscription = async (pageId, accessToken) => {
        try {
          const response = await axios.get(
            `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
            { params: { access_token: accessToken } }
          );
          
          return response.data.data?.some(app => app.id === process.env.FB_APP_ID);
        } catch (error) {
          console.error('Verification failed:', error);
          return false;
        }
      };
      

      // Get All pages from facebook accounts
      const pagesRes = await axios.get(
        `https://graph.facebook.com/v22.0/me/accounts?access_token=${facebookAccount.fb_access_token}`
      );

      await FacebookPage.bulkCreate(
        pagesRes.data.data.map(page => ({
          facebook_id: facebookAccount.id, 
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token
        })),
        { updateOnDuplicate: ['page_access_token'] }
      );

      for (const page of pagesRes.data.data) {
        const existing = await FacebookPage.findOne({ where: { page_id: page.id } });
        if (!existing) continue;
        
        const isSubscribed = await verifySubscription(page.id, page.access_token);
        if (!isSubscribed) {
          await subscribePageToWebhook(page.id, page.access_token);
        }
      }
  
      const token = jwt.sign(
        { id: facebookAccount.id, fb_user_id: facebookAccount.fb_user_id },
        process.env.JWT_SECRET, // Add this secret in your .env file
        { expiresIn: "7d" }
      );

      // ✅ Optional: Set token as cookie (or just redirect with it in URL)
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect(`http://localhost:5173/dashboard?token=${token}&user_id=${facebookAccount.id}`);
    } catch (error) {
      console.error("Error:", error);
      res.redirect(`http://localhost:5173/error?message=${encodeURIComponent(error.message)}`);
    }
  }
  
);
router.use(authenticateToken);
router.get('/', async (req, res) => {
  try {
    const channels = await FacebookAccount.findAll({
      where: { id: req.query.id },
      include: [ChannelPage]
    });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this PUT route handler
router.put('/pages/:pageId', async (req, res) => {
  try {
    const page = await FacebookPage.findOne({
      where: { page_id: req.params.pageId },
      include: FacebookAccount
    });
    console.log(page);
    

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Verify page belongs to logged-in user
    if (page.FacebookAccount.id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await page.update({
      active_template_id: req.body.active_template_id
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;