const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "business_suite_database",
  port: 3307
});

db.connect((err) => {
  if (err) {
    console.log("DB not connected", err);
  } else {
    console.log("MySQL connected!");
  }
});

module.exports = db;
