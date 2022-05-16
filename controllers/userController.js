const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require("../utils");

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password");
  res.status(StatusCodes.OK).json({ users });
};

// Access user profile with their user id.
// Note Issue - Need to handle scenario where a user is logged in but if they have another user's id they will be able to get their profile simply by /users/123
// Fix - Check for user permissions
const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password");
  if (!user) {
    throw new CustomError.NotFoundError(`No user with id: ${req.params.id}`);
  }

  checkPermissions(req.user, user._id); // Checks roles, authorized to access routes.

  res.status(StatusCodes.OK).json({ user });
};

// Useful route to get user in token.  Token is authenticated and req.user used.  No db query made.
// Can be called on initial page load, page refresh.
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user }); // Authenticated via route
};

// Update user with user.save() vs .findOneAndUpdate()
const updateUser = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;

  await user.save(); // Note UserSchema.pre("save",..) will fire. Be careful that there may be code that we do not want to run on this user ex: re-hashing the password.

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }

  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword; // Unhashed
  await user.save(); // Password hashed in the process

  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated" });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};

// Reference - Update user with .findOneAndUpdate() - This will not trigger the 'save' hook in Schema.
/*
const updateUser = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user.userId },
    { email, name },
    { new: true, runValidators: true }
  );

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};
*/
