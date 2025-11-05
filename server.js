const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const app = express()

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

const { globalErrorHandler } = require("./middleware/errorHandler")
const logger = require("./utils/logger")

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/food-delivery", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info("MongoDB connected successfully"))
  .catch((err) => logger.error("MongoDB connection error:", err))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/restaurants", require("./routes/restaurants"))
app.use("/api/menu", require("./routes/menu"))
app.use("/api/orders", require("./routes/orders"))
app.use("/api/cart", require("./routes/cart")) // Add missing cart route
app.use("/api/admin", require("./routes/admin"))
app.use("/api/contact", require("./routes/contact"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Food Delivery API is running",
    timestamp: new Date().toISOString(),
  })
})

app.use(globalErrorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

module.exports = app
