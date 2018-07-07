const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const servicehelper = require("./utils/ServiceHelper");
const generalhelper = require("./utils/GeneralHelper");
const constants = require("./constants");

/**
 * Receives the Form posting, not suitable for multipart form data
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const receiveSubmitData = (req, res, next) =>  {
    console.log(" IN: receiveSubmitData");
    const formObject = req.body.data ; 
    res.locals.formObject = formObject; 
    next();
};

const processPkg = (req, res, next) => {

}

/**
 * Load pkg for IRI
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const loadPkgForIri = (req, res, next) =>  {
    console.log(" IN: loadPkgForIri");
    let {iri} = res.locals.formObject;
    iri = iri.startsWith("/") ? iri : `/${iri}`;

    const loadPkgApi = servicehelper.getApi("editor-fe", "loadPkg");
    const {url, method} = loadPkgApi;

    axios({
        method: method,
        url: url,
        data: {"data": {"iri": iri}},
        responseType: 'stream'
    }).then(
        (response) => {
            const filename = generalhelper.fnameFromResponse(response);
            const opFname = path.join(constants.TMP_AKN_FOLDER(), filename);
            response.data.pipe(fs.createWriteStream(opFname));

            response.data.on('end', () => {
                res.locals.returnResponse = {"status": "success"};
                next();
            });

            response.data.on('error', () => {
                res.locals.returnResponse = {"status": "error"};
                next();
            });
        }
    ).catch((err) => {
            console.log(err);
            next();
        }
    );
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const returnResponse = (req, res) => {
    console.log(" IN: returnResponse");    
    res.json(res.locals.returnResponse);
};

/**
 * API methods for each Request end point.
 * You need to call next() at the end to ensure the next api in the chain
 * gets called.
 * Calling res.json(res.locals.returnResponse) will return the response 
 * without proceeding to the next method in the API stack. 
 */
module.exports = {
    receiveSubmitData: receiveSubmitData,
    loadPkgForIri:loadPkgForIri,
    returnResponse: returnResponse
};