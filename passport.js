//const passport = require('passport');
//const GoogleStrategy = require('passport-google-oauth20').Strategy;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./Model/userSchema'); // Ensure the correct path to your User model

passport.use(
  new GoogleStrategy(
    {
        // clientID: '610793544656-rnf6ipsr6604m3lg6sknqcnqesc2pkat.apps.googleusercontent.com',
        // clientSecret: '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',
        clientID: process.env.GOOGLE_CLIENT_ID,
clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:8080/user/google_auth', // Update this line
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists in the database
        let user = await User.findOne({ googleId: profile.id });
        let isNewUser = false;
        if (!user) {
          // If not, check if a user with the same email exists
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (!user) {
            // If no user exists with this email, create a new user
            isNewUser = true;
            user = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              is_list :true,
              wallet_bal : 0
            });
          } else {
            // If a user exists with this email but not linked to Google, update the user
            user.googleId = profile.id;
          }
          
          await user.save();
        }
        done(null,{user,isNewUser} );
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((result, done) => {
  done(null, {id: result.user.id,isNewUser : result.isNewUser});
});

passport.deserializeUser(async (data, done) => {
  try {
    const user = await User.findById(data.id);
    done(null, {user,isNewUser:data.isNewUser});
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;





