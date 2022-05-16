const CustomError = require("../errors");

const checkPermissions = (requestUser, resourceUserId) => {
  // console.log(requestUser); // User authenticated token
  // console.log(resourceUserId); // User id being requested from url params.id
  // console.log(typeof resourceUserId); // note this is an object from resource user._id

  if (requestUser.role === "admin") return; // Admin can do whatever they want
  if (requestUser.userId === resourceUserId.toString()) return; // Matches allowed to perform activity
  throw new CustomError.UnauthenticatedError(
    "Not authorized to access this route"
  );
};

module.exports = checkPermissions;

/*
When it comes to accessing other user's profile only the 'admin' or user self can access the route.
1 If 'admin' roles from accessing routes then allow.  Note return will allow admin to check other resource user profiles.
2 If user requesting own resource then allow
3 Else not authorized to access route.
*/
