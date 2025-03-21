// facebook.controller.js (Updated Passport Strategy)
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const { Channel } = require('../models');

passport.use(new FacebookStrategy({
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
  callbackURL: "/api/channel/facebook/callback",
  profileFields: ['id', 'displayName', 'email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // ✅ Access user ID from request object
    const userId = req.query.state; // ✅ Extract user_id from state
    
    if (!userId) {
      return done(new Error("User ID not found in request"));
    }

    const [channel] = await Channel.findOrCreate({
      where: { fb_user_id: profile.id },
      defaults: {
        user_id: userId,
        fb_user_id: profile.id,
        fb_access_token: accessToken,
        platform: 'messenger'
      }
    });

    if (channel.fb_access_token !== accessToken) {
      await channel.update({ fb_access_token: accessToken });
    }

    done(null, channel);
  } catch (error) {
    done(error);
  }
}));
