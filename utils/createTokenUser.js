const createTokenUser = (user) => {
  return { name: user.name, userId: user._id, role: user.role }; // Better approach, payload for jwt token
};

module.exports = createTokenUser;
