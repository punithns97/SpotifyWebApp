const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy
const clientId = '5262a5ba514a4b4a80f53fbbf9adb3f0'
const clientSecret = 'b880230554024195aaaae59322312306';
const redirectUri = 'http://localhost:3000/callback'


//serialize and deserialize user are functions to handle sessions automatically
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use('spotify',
  new SpotifyStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: redirectUri
    },
    async function(accessToken, refreshToken, expires_in, profile, done) {
      try {
        const userResponse = {
          ...profile,
          accessToken,
          refreshToken,
          expires_in
        }
        done(null, userResponse)
      } catch (err) {
        done(err, null, { message: 'An error ocurred trying to authenticate the user'})
      }
    }
  )
)