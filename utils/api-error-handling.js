/**
 * API Error Handling Guidelines
 * 
 * Use this document as a reference for implementing consistent error handling
 * across all API routes in the MovieaTN application.
 */

/**
 * BEST PRACTICES FOR ERROR HANDLING
 * 
 * 1. Always wrap route handlers in try/catch blocks
 * 2. Use the enhanced safeJsonParse function for all API responses
 * 3. Log detailed error information using console.error
 * 4. Return appropriate HTTP status codes based on the error type
 * 5. Check for TMDB-specific error formats
 * 6. Include relevant diagnostic information in error responses
 * 7. Validate required parameters before making API calls
 */

/**
 * TEMPLATE FOR API ROUTES
 * 
 * Use this template when implementing or updating API routes:
 */

// Template for API route handlers
router.get('/example/:id', async (req, res) => {
    try {
        // 1. Extract and validate parameters
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({
                error: 'Missing required parameter',
                message: 'ID parameter is required'
            });
        }
        
        console.log(`Fetching example data for ID: ${id}`);
        
        // 2. Make API request with proper error handling
        const response = await fetch(`${API_BASE}/example/${id}?api_key=${API_KEY}`);
        const data = await safeJsonParse(response);
        
        // 3. Check for errors from safeJsonParse
        if (data && data.error) {
            console.error(`Error fetching example data for ${id}: ${data.error}`);
            return res.status(data.status || 502).json({
                error: data.error,
                message: 'Failed to retrieve data from upstream API',
                id: id
            });
        }
        
        // 4. Check for API-specific error responses
        if (data && data.success === false) {
            console.error(`API error for ${id}: ${data.status_message}`);
            return res.status(data.status_code || 404).json({
                error: data.status_message || 'Resource not found',
                message: 'API returned an error response',
                id: id
            });
        }
        
        // 5. Check for empty or invalid responses
        if (!data || Object.keys(data).length === 0) {
            console.log(`No data found for ID ${id}`);
            return res.status(404).json({
                error: 'Not found',
                message: 'No data available for the requested resource',
                id: id
            });
        }
        
        // 6. Success case
        res.send(data);
    } catch (error) {
        // 7. Handle unexpected errors
        console.error(`Exception in /example/${req.params.id}:`, error.message);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            id: req.params.id
        });
    }
});

/**
 * UPGRADES TO MAKE TO EXISTING CODE
 * 
 * 1. Update safeJsonParse in utils/helpers.js with enhanced error handling
 * 2. Add try/catch blocks to all route handlers
 * 3. Improve error responses with proper status codes and messages
 * 4. Add detailed logging for all errors
 * 5. Create standards for error response format
 * 6. Add parameter validation to all routes
 */

/**
 * ERROR RESPONSE FORMAT
 * 
 * All error responses should follow this format:
 * 
 * {
 *   error: "Short error code or message",
 *   message: "Human-readable error description",
 *   <identifier>: <value>  // ID of the resource being requested
 *   details: { ... }       // Optional additional details
 * }
 */
