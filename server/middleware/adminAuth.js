/**
 * Admin Authorization Middleware
 * Restricts access to admin-only routes
 */

const adminAuth = (req, res, next) => {
    try {
        // Check if user exists and is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization failed'
        });
    }
};

module.exports = adminAuth;
