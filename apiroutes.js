const express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
const packageJSON = require("./package.json");
const dsapis = require ("./digiSign.routes");

var upload = multer();

var router = express.Router();

var jsonParser = bodyParser.json();

/** adding Digi Sign apis */
Object.keys(dsapis.dsAPIs).forEach(
    (routePath) => {
        const dsRoute = dsapis.dsAPIs[routePath];
        console.log(` ROUTE PATH = ${routePath} with ${dsRoute.method}`);
        switch(dsRoute.method) {
        case "post":
            router.post(
                routePath,
                jsonParser,
                dsRoute.stack
            );
            break;
        default:
            logr.error(`Unknown method provide ${dsRoute.method} only "post" is supported` );
            break;
        }
    }
);

module.exports = router;

