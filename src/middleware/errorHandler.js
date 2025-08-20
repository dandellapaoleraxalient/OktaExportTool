/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  console.error('❌ Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = error.message;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message.includes('OKTA_DOMAIN') || error.message.includes('OKTA_API_TOKEN')) {
    statusCode = 500;
    message = 'Okta configuration error';
    details = 'Please check your Okta domain and API token configuration';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
