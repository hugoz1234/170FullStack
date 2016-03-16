

module.exports = {

  db: process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/andchill',

  sessionSecret: process.env.SESSION_SECRET || 'Your Session Secret goes here',

  moviedb: 'd09547ed43f870a1aae4bf16d37eabb0',

  facebook: {
    clientID: process.env.FACEBOOK_ID || '113185335714276',
    clientSecret: process.env.FACEBOOK_SECRET || '26f1b57e0e8f786343eabd95ddbc96c7',
    callbackURL: '/auth/facebook/callback',
    passReqToCallback: true
  }
};
