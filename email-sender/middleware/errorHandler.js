const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Default to 500 server error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Handle development vs production error details
    const errorResponse = {
        status: statusCode,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    res.status(statusCode);

    // Render error page for HTML requests, send JSON for API requests
    if (req.accepts('html')) {
        res.render('error', { 
            title: 'Error',
            error: errorResponse
        });
    } else {
        res.json(errorResponse);
    }
};

module.exports = errorHandler; 