const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();

// mongodb connection
const password = process.env.DATABASE_PASSWORD;
const DB = process.env.DATABASE.replace("<PASSWORD>", password);

mongoose
  .connect(DB)
  .then(() => console.log("✅ DB connection successful"))
  .catch((err) => console.error("❌ DB connection failed:", err));

// server listen
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server running at ${port}`);
});
