/**
 * Centralized Error Handler
 * Provides consistent error handling across all controllers
 */

class ErrorHandler {
  /**
   * Handle common controller errors with consistent response format
   * @param {Error} error - The error object
   * @param {Object} res - Express response object
   * @param {string} context - Context for logging (e.g., 'Get profile')
   */
  static handleControllerError(error, res, context = 'Operation') {
    console.error(`${context} error:`, error);

    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('Access denied') || 
        error.message.includes('permission') ||
        error.message.includes('authorized')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('required') || 
        error.message.includes('must be') ||
        error.message.includes('Invalid') ||
        error.message.includes('validation')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('already exists') ||
        error.message.includes('duplicate')) {
      return res.status(409).json({ error: error.message });
    }

    // Default server error
    return res.status(500).json({ error: error.message });
  }

  /**
   * Handle success responses with consistent format
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static handleSuccess(res, data = {}, message = 'Operation successful', statusCode = 200) {
    const response = { message };
    
    // Add data properties to response
    Object.assign(response, data);
    
    return res.status(statusCode).json(response);
  }

  /**
   * Validate required fields in request body
   * @param {Object} body - Request body
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If any required field is missing
   */
  static validateRequiredFields(body, requiredFields) {
    const missingFields = requiredFields.filter(field => 
      body[field] === undefined || body[field] === null || body[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}

module.exports = ErrorHandler;
