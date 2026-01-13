/**
 * Error Handling Utilities
 * Standardized error response creation for MCP and HTTP
 */

/**
 * Create MCP error response
 * @param {string} message - Error message
 * @returns {Object} MCP error response object
 */
export function createMcpErrorResponse(message) {
    return {
        content: [
            {
                type: 'text',
                text: message,
            },
        ],
        isError: true,
    };
}

/**
 * Create MCP success response
 * @param {string} text - Response text
 * @returns {Object} MCP success response object
 */
export function createMcpSuccessResponse(text) {
    return {
        content: [
            {
                type: 'text',
                text: text,
            },
        ],
    };
}

/**
 * Create HTTP error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} HTTP error response object
 */
export function createHttpErrorResponse(statusCode, message) {
    return {
        statusCode,
        body: {
            error: message,
        },
    };
}

/**
 * Create HTTP success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} HTTP success response object
 */
export function createHttpSuccessResponse(data, message) {
    return {
        statusCode: 200,
        body: {
            success: true,
            data: data,
            message: message,
        },
    };
}
