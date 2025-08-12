const express = require("express");
const path = require("path");
const userRouter = require("./routes/userRoutes");
const linkRouter = require("./routes/linkRoutes");
const randomDataRouter = require("./routes/randomDataRoutes");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(express.json());

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "too many request from this IP, plase try again in an hour",
});

app.use("/api", limiter);

app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});
app.use("/fetch", randomDataRouter);
app.use("/v1/users", userRouter);
app.use("/links", linkRouter);
app.get("/form/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "form.html"));
});

module.exports = app;
