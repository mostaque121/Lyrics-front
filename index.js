// index.js or server.js

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Internal Imports
const HomeRouter = require('./RouteController/HomeRouter');
const UserRouter = require('./RouteController/UserRouter');
const ViewRouter = require('./RouteController/ViewRouter');
const SignupRouter = require('./RouteController/SignupRouter');
const LoginRouter = require('./RouteController/LoginRouter');
const ProfileRouter = require('./RouteController/ProfileRouter');
const BossRouter = require('./RouteController/BossRouter');
const MessageRouter = require('./RouteController/MessageRouter');

// Socket.io setup import
const setupSocketIO = require('./Services/socket');

// App and Server Setup
const app = express();
const server = http.createServer(app);  // Create the HTTP server

// Initialize Socket.io with the server
const io = setupSocketIO(server);
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => console.log("Database connection successful!"))
  .catch(err => console.error('Database connection error:', err));

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Routing setup
app.get("/", (req, res) => {
  res.json("hi");
});

app.use("/Home", HomeRouter);
app.use("/User", UserRouter);
app.use("/View", ViewRouter);
app.use("/Signup", SignupRouter);
app.use("/Login", LoginRouter);
app.use("/Profile", ProfileRouter);
app.use("/Boss", BossRouter);
app.use("/Message", MessageRouter);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

