// facebook.controller.js (Updated Passport Strategy)
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const { FacebookAccount } = require('../models');

passport.use(new FacebookStrategy({
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
  callbackURL: "/api/channel/facebook/callback",
  scope: ["pages_manage_metadata", "pages_messaging", "pages_show_list"],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const [facebookAccount] = await FacebookAccount.findOrCreate({
      where: { fb_user_id: profile.id },
      defaults: {

        fb_user_id: profile.id,
        fb_access_token: accessToken,
        platform: 'messenger'
      }
    });

    if (facebookAccount.fb_access_token !== accessToken) {
      await FacebookAccount.update(
        { fb_access_token: accessToken },
        { where: { id: facebookAccount.id } } // Add this where clause
      );
    }

    done(null, facebookAccount);
  } catch (error) {
    done(error);
  }
}));
