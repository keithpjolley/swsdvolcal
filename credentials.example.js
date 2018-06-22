// I don't see a reason to complicate this with more than a single user right now.
// see https://www.npmjs.com/package/express-basic-auth
const valid = {
  users: {theusername: 'thesecret'},
  challenge: true
};

module.exports = valid;
