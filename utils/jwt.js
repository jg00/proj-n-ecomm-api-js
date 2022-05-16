const jwt = require("jsonwebtoken");

// Use in controllers/authController - register
const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

// Use in middleware/authentication
const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET);

// Use in controllers/authController - register
const attachCookiesToResponse = ({ res, user }) => {
  // Token. Role passed for role based authentication.
  const token = createJWT({ payload: user });

  // Cookie expiration set to one day to match the JWT expiration we also set to one day
  const oneDay = 1000 * 60 * 60 * 24; // ms * 60 (=1min) * 60 (=1hr) * 24 (=1day); returns ms

  // To attach a cookie to our response use express res.cookie() - token in response + store in local storage vs token in cookie
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === "production", // https
    signed: true, // req.signedCookies
  });
};

module.exports = { createJWT, isTokenValid, attachCookiesToResponse };
