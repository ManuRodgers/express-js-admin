const mongoose = require("mongoose");
const express = require("express");
const app = express();

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const indexRouter = require("./routers");
app.use("/api", indexRouter); //

const fs = require("fs");

// server 404 page
app.use((req, res) => {
  fs.readFile(__dirname + "/public/index.html", (err, data) => {
    if (err) {
      console.log(err);
      res.send("server error");
    } else {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });
      res.end(data);
    }
  });
});

// mongoose
mongoose
  .connect(
    "mongodb+srv://ManuRodgers:LJX123mvp@admin-server-947sk.mongodb.net/admin-server?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(() => {
    console.log("connection ok!!!");
    // launch express server after database connected successfully
    app.listen("5000", () => {
      console.log("server is running on port 5000");
    });
  })
  .catch(error => {
    console.error("connect database failed", error);
  });
