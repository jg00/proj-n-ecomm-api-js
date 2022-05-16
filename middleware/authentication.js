const CustomError = require("../errors");
const { isTokenValid } = require("../utils");

const authenticateUser = async (req, res, next) => {
  const token = req.signedCookies.token;

  if (!token) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }

  try {
    const { name, userId, role } = isTokenValid({ token });
    req.user = { name, userId, role }; // req.user is availble in the request cycle.
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }
};

// Return a function so that authorizePermissions function will be used as a callback function Express is expecting. Route.get() requires a callback function.
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

/* Before refactor in order to accept arguments when invoked in the route
const authorizePermissions = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new CustomError.UnauthorizedError(
      "Unauthorized to access this route"
    );
  }
  next();
};
*/

/*
Is the user Authenticated?
1 token is sent via cookie when user logs in or registers successfully
- if no token then unauthenticated
2 outgoing cookie is signed and incomming cookie is validated via cookie-parser
3 our jwt token includes our payload that we specifiy with userId and any other fields we want
4 req.user is populated with token payload info.
-- At this point our user is authenticated --

Is the user Authorized?
*/

module.exports = { authenticateUser, authorizePermissions };
