const http = require("http");
const express = require("express");
const socketIo = require("socket.io");
const Socket = require("./config/socket");
const cors = require("cors");
const morgan = require("morgan");
const AppError = require("./utils/AppError");
const app = express();
const routes = require("./routes/v1/");

const server = http.Server(app);

const io = socketIo(server, {
  cors: {
    origin: [process.env.CLIENT],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

Socket(io);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

var whitelist = [process.env.CLIENT, undefined];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new AppError("Not allowed by CORS", 404));
    }
  },
};

app.use(cors(corsOptions));

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use("/v1", routes);

app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`), 404);
});

const globalErrorHandler = async (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log("global error ", err.message);
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

app.use(globalErrorHandler);

module.exports = { app, server };
