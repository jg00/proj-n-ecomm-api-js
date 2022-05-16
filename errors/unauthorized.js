const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("./custom-api");

class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.status = StatusCodes.FORBIDDEN; // 403
  }
}

module.exports = UnauthorizedError;
