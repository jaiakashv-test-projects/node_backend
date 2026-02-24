const pool = require("./services/db");
const bcrypt = require("bcryptjs");

async function initDB() {
    try {
        console.log("Initializing Users table...");

        // Create users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL, -- 'operator', 'ota', 'government'
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log("Users table ready.");

        // Seed users
        const users = [
            { email: "operator@travelflux.com", password: "operator123", role: "operator", name: "Bus Operator Admin" },
            { email: "ota@travelflux.com", password: "ota123", role: "ota", name: "OTA Partner" },
            { email: "government@travelflux.com", password: "government123", role: "government", name: "Transport Ministry" }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(
                "INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
                [user.email, hashedPassword, user.role, user.name]
            );
            console.log(`User seeded: ${user.email} (${user.role})`);
        }

        console.log("Database initialization complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error initializing database:", err);
        process.exit(1);
    }
}

initDB();
