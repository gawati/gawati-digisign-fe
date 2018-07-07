const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const extract = require("extract-zip");
const md5File = require('md5-file');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const servicehelper = require("./utils/ServiceHelper");
const generalhelper = require("./utils/GeneralHelper");
const urihelper = require("./utils/UriHelper");
const filehelper = require("./utils/FileHelper");
const constants = require("./constants");

/**
 * Extract a zip folder
 */
const unzip = (src, dest) => {
  return new Promise(function(resolve, reject) {
    extract(src, {dir: dest}, function(err) {
      if (err) reject(err);
      else resolve(true);
    })
  });
}

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

/**
 * Compute and Inject Checksums for each attachment
 * Parse aknXml to get attachments info
 * For each attachment, compute checksum 
 * Inject checksum as an attribute into <an:embeddedContent>
 * Return updated aknXml
 */
const injectChecksums = (aknXml, pkgFolder) => {
	let doc = new DOMParser().parseFromString(aknXml);
	let atts = doc.getElementsByTagName("an:embeddedContent");
	for (let i = 0; i < atts.length; i++) {
		const attFname = atts[i].getAttribute('file');
		const attFpath = path.resolve(constants.TMP_AKN_FOLDER(), pkgFolder, attFname);
		//To-Do: Make async
		const checksum = md5File.sync(attFpath);
		atts[i].setAttribute('checksum',checksum);
	}
	return new XMLSerializer().serializeToString(doc);
}

const processPkg = (req, res, next) => {
    const pkgFolder = path.basename(res.locals.zipPath, '.zip');
    const dest = constants.TMP_AKN_FOLDER();

	//XML doc name and path
	let {iri} = res.locals.formObject;
	const docName = urihelper.fileNameFromIRI(iri, "xml");

	//Use resolve to avoid repeated paths in windows.
	const docPath = path.resolve(constants.TMP_AKN_FOLDER(), pkgFolder, docName);

    unzip(res.locals.zipPath, path.resolve(dest))
    .then((result) => {
		return filehelper.readFile(docPath);
    })
	.then((aknXml) => {
		newXml = injectChecksums(aknXml, pkgFolder);
		return filehelper.writeFile(newXml, docPath);
	})
	.then((result) => {
		console.log("Now post to /sign");
		next();
	})
	.catch((err) => {
		console.log(err);
		next();
	})
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
            res.locals.zipPath = path.join(constants.TMP_AKN_FOLDER(), filename);
            response.data.pipe(fs.createWriteStream(res.locals.zipPath));

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
	processPkg: processPkg,
    returnResponse: returnResponse
};