/**
 * Common format for API Gateway responses
 */

// Success response with 200 status code
const success = (body) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
};

// Created response with 201 status code
const created = (body) => {
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
};

// Error response with custom status code
const error = (statusCode, message) => {
  return {
    statusCode: statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      error: message || 'An unknown error occurred'
    })
  };
};

// Bad request error (400)
const badRequest = (message) => {
  return error(400, message || 'Bad request');
};

// Not found error (404)
const notFound = (message) => {
  return error(404, message || 'Resource not found');
};

// Server error (500)
const serverError = (message) => {
  return error(500, message || 'Internal server error');
};

// Unauthorized error (401)
const unauthorized = (message) => {
  return error(401, message || 'Unauthorized');
};

// Forbidden error (403)
const forbidden = (message) => {
  return error(403, message || 'Forbidden');
};

module.exports = {
  success,
  created,
  error,
  badRequest,
  notFound,
  serverError,
  unauthorized,
  forbidden
};
