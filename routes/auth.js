const express = require("express");
const router = express.Router();
const pool = require("../services/db");
const bcrypt = require("bcryptjs");

// Map roles to their dashboard paths
const ROLE_PATHS = {
    'operator': '/',
    'ota': '/ota',
    'government': '/gov'
};

router.post("/login", async (req, res) => {
    const { username, password } = req.body; // username here is treated as the email

    try {
        // Search for user by email (from the screenshot provided)
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // Verify hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                success: true,
                user: {
                    username: user.email,
                    role: user.role,
                    path: ROLE_PATHS[user.role] || '/'
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
