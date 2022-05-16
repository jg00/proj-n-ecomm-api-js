const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // First registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  // Create user with hashed password
  const user = await User.create({ name, email, password, role }); // Never send back
  const tokenUser = createTokenUser(user); // Better approach, payload for jwt token
  attachCookiesToResponse({ res, user: tokenUser });

  // res.status(StatusCodes.CREATED).json({ user: tokenUser, token }); // Prior to cookies included token in the response
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email }); // returns instance of a user
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

// Apply to cookie with the same name 'token', not setting JWT but random second value
const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()), // This is what removes the cookie from the browser
    // expires: new Date(Date.now() + 5 * 1000), // 5 secs test only
  });
  res.status(StatusCodes.OK).json({ msg: "user looged out!" }); // In general front-end does not use this
};

module.exports = { register, login, logout };
