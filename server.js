const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({
  path: "./config.env",
});

const { server } = require("./app");
const port = process.env.PORT || 3000;

// const DB = process.env.DATABASE_URL.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );
// mongoose
//   .connect(DB)
//   .then(() => {
//     console.log("DB connection success");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

server.listen(port, () => {
  console.log(`server is up and running on port ${port} 🚀`);
});
