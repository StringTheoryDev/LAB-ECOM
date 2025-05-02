const mysql = require('mysql2/promise');
// const fs = require('fs'); // Only required if you need to load a CA file from disk

console.log(`DB Config: Attempting to connect to host ${process.env.DB_HOST} on port ${process.env.DB_PORT || 4000}`); // Log host/port being used

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000, // Use DB_PORT from env, default to 4000 for TiDB Cloud
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
  ssl: {
    // Required for TiDB Cloud and most cloud databases.
    // These settings usually work for TiDB Cloud without needing a specific CA file.
    // Render's environment should handle the underlying CA certificates.
    minVersion: 'TLSv1.2', // Specify minimum TLS version
    rejectUnauthorized: true // Enforce certificate validation (recommended)

    // --- Optional: Use if TiDB Cloud connection fails and you downloaded their CA cert ---
    // Make sure the CA cert file is accessible in your deployment environment
    // (You might need to add it to your repo or handle it via build steps/secrets)
    // ca: fs.readFileSync('/path/to/your/downloaded/ca-certificate.pem')
    // --- End Optional ---
  }
});

// Test connection on startup (optional but helpful)
pool.getConnection()
  .then(connection => {
    console.log('Database connection test successful!');
    connection.release();
  })
  .catch(err => {
    console.error('FATAL DATABASE CONNECTION ERROR:', err.message);

    // process.exit(1);
  });

module.exports = pool;
