const express = require("express");
const path = require("path");
const rabbit = require("./queues");
const routes = require("./apiroutes");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const cors = require('cors');

var app = express();

const env = process.env.NODE_ENV || "production" ;

console.log(" ENVIRONMENT  = ", env);

// To avoid this error:
// Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:3000' is therefore not allowed access.

if (env === "development") {
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
      }));
}

// view engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwwww-form-encoded etc
app.use(bodyParser.urlencoded({ extended: true }));

// for parsing multipart/form-data
// app.use(upload.array()); 

// for parsing cookies
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// INDEX_DEL
//app.use("/", index);

app.use("/gwds", routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
