const express = require("express");
const router = express.Router();

// In a real app, you would fetch this from the database
const MOCK_USERS = [
    { username: 'operator', password: 'password123', role: 'operator', path: '/' },
    { username: 'admin', password: 'password123', role: 'admin', path: '/analytics' },
    { username: 'fleet_manager', password: 'password123', role: 'fleet', path: '/fleet' },
    { username: 'ota', password: 'password123', role: 'ota', path: '/ota' },
    { username: 'gov', password: 'password123', role: 'government', path: '/gov' }
];

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = MOCK_USERS.find(u => u.username === username && u.password === password);

        if (user) {
            // In a real app, generate a JWT here
            res.json({
                success: true,
                user: {
                    username: user.username,
                    role: user.role,
                    path: user.path
                },
                message: "Login successful"
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
});

module.exports = router;
