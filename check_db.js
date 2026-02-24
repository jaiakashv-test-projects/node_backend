const pool = require("./services/db");

async function checkUsers() {
    try {
        const result = await pool.query("SELECT email, role FROM users");
        console.log("Current users in DB:");
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error("Error checking users:", err);
        process.exit(1);
    }
}

checkUsers();
