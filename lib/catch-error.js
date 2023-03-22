// wrapper for async middleware. No need to catch errors in main code anymore.
const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next).catch(next));
  };
};

module.exports = catchError;