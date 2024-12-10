const db = require('../db');

// Middleware to check for a specific role
const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        const userId = req.user.id; // Populated by authenticateJWT middleware

        try {
            const [rows] = await db.execute('SELECT role FROM Users WHERE id = ?', [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userRole = rows[0].role;

            if (userRole !== requiredRole) {
                return res.status(403).json({ message: `Access denied: Requires ${requiredRole} role` });
            }

            next(); // User has the required role, proceed to the next middleware or route handler
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
};

module.exports = checkRole;
