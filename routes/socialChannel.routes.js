// socialChannel.routes.js
const express = require("express");
const passport = require("passport");
const axios = require("axios");
const crypto = require("crypto");
const { ChannelPage, Channel } = require("../models");
const router = express.Router();


router.get("/facebook/", (req, res, next) => {
  const userId = req.query.user_id;
  

  passport.authenticate("facebook", {
    scope: ["pages_messaging", "pages_show_list"],
    auth_type: "reauthenticate",
    session: false,
    state: userId
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
      const channel = req.user;
      console.log(channel);
      

      // Get All pages from facebook accounts
      const pagesRes = await axios.get(
        `https://graph.facebook.com/v22.0/me/accounts?access_token=${channel.fb_access_token}`
      );

      await ChannelPage.bulkCreate(
        pagesRes.data.data.map(page => ({
          channel_id: channel.id,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token
        })),
        { updateOnDuplicate: ['page_access_token'] }
      );

      res.redirect(`http://localhost:5173/dashboard?user_id=${channel.user_id}`);
    } catch (error) {
      console.error("Error:", error);
      res.redirect(`http://localhost:5173/error?message=${encodeURIComponent(error.message)}`);
    }
  }
  
);

router.get('/', async (req, res) => {
  try {
    const channels = await Channel.findAll({
      where: { user_id: req.query.user_id },
      include: [ChannelPage]
    });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;