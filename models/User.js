const mongoose = require("mongoose");
const validator = require("validator"); // alternative to match: [regex,msg]

const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
});

// Registration - Hash password prior to User.create
UserSchema.pre("save", async function () {
  // console.log(this.modifiedPaths()); // returns [] of fields being modified. ex: [ 'email', 'name' ] or [ 'email' ]
  // console.log(this.isModified("name")); // returns if field specified is beign modified

  if (!this.isModified("password")) return;

  // Essentially only when we are creating a new user or when we are updating the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Login.  Side note - method is on the 'instance'
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
