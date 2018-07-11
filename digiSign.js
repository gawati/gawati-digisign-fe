/**
 * Sign and Validate and AKN package
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const extract = require("extract-zip");
const md5File = require('md5-file');
const FormData = require('form-data');
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
 * Check if return response status is errored
 */
const isError = (returnResponse) => {
    if (returnResponse && 'status' in returnResponse)
		return returnResponse.status === 'error';
	else
		return false;
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

const getDocPath = (locals) => {
    const pkgFolder = path.basename(locals.zipPath, '.zip');
	//XML doc name and path
	let {iri} = locals.formObject;
	const docName = urihelper.fileNameFromIRI(iri, "xml");
	const docPath = path.resolve(constants.TMP_AKN_FOLDER(), pkgFolder, docName);
    return docPath;
}

/**
 * Upload the signed pkg.
 * Save the signed metadata xml and public key in the database.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const uploadSignedPkg = (req, res, next) => {
    console.log(" IN: uploadSignedPkg");
    if (!isError(res.locals.returnResponse)) { 
        const uploadPkgApi = servicehelper.getApi("editor-fe", "uploadPkg");
        const {url, method} = uploadPkgApi;

        const docPath = getDocPath(res.locals);
        const pubPath = constants.SIGN_KEYS_PATH["public"];

        let data = new FormData();
        data.append('iri', res.locals.formObject.iri);
        data.append('file', fs.createReadStream(docPath));
        data.append('public_key', fs.createReadStream(pubPath));

        axios({
            method: method,
            url: url,
            data: data,
            headers: data.getHeaders()
        }).then((response) => {
            res.locals.returnResponse = response.data;
            next();
        }).catch((err) => {
            res.locals.returnResponse = {"status": "error", "msg": "Error while uploading the signed IRI package"};
            console.log(err);
            next();
        });
    } else {
        next();
    }
}

/**
 * Sign the processed metadata xml
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const signPkg = (req, res, next) => {
    console.log(" IN: signPkg");
    if (!isError(res.locals.returnResponse)) {
        const signApi = servicehelper.getApi("package-sign", "sign");
        const {url, method} = signApi;

        const docPath = getDocPath(res.locals);
        const pubPath = constants.SIGN_KEYS_PATH["public"];
        const priPath = constants.SIGN_KEYS_PATH["private"];

        let data = new FormData();
        data.append('input_file', fs.createReadStream(docPath));
        data.append('public_key', fs.createReadStream(pubPath));
        data.append('private_key', fs.createReadStream(priPath));

        axios({
            method: method,
            url: url,
            data: data,
            headers: data.getHeaders()
        }).then((response) => {
            return filehelper.writeFile(response.data, docPath);
        })
        .then(result => next())
        .catch((err) => {
            res.locals.returnResponse = {"status": "error", "msg": "Error while signing the IRI package"};
            console.log(err);
            next();
        });
    } else {
        next();
    }
}

/**
 * Process pkg.
 * For each attachment in the package, compute and inject checksum within
 * the metadata xml.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const processPkg = (req, res, next) => {
    console.log(" IN: processPkg");
    if (!isError(res.locals.returnResponse)) {
        const pkgFolder = path.basename(res.locals.zipPath, '.zip');
        const dest = constants.TMP_AKN_FOLDER();
        const docPath = getDocPath(res.locals);

        unzip(res.locals.zipPath, path.resolve(dest))
        .then((result) => {
            return filehelper.readFile(docPath);
        })
        .then((aknXml) => {
            newXml = injectChecksums(aknXml, pkgFolder);
            return filehelper.writeFile(newXml, docPath);
        })
        .then((result) => {
            next();
        })
        .catch((err) => {
            res.locals.returnResponse = {"status": "error", "msg": "Error while processing the IRI package"};
            console.log(err);
            next();
        })   
    } else {
        next();
    }
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
    }).then((response) => {
        const contentType = response.headers['content-type'];
        if (contentType.indexOf('application/json') !== -1) {
            res.locals.returnResponse = {"status": "error", "msg": "Error while loading the IRI package"};
            next();
        } else {
            const filename = generalhelper.fnameFromResponse(response);
            res.locals.zipPath = path.join(constants.TMP_AKN_FOLDER(), filename);
            response.data.pipe(fs.createWriteStream(res.locals.zipPath));

            response.data.on('end', () => {
                next();
            });

            response.data.on('error', () => {
                res.locals.returnResponse = {"status": "error", "msg": "Error while unzipping the IRI package"};
                next();
            });
        }
    })
    .catch((err) => {
        res.locals.returnResponse = {"status": "error", "msg": "Error while loading the IRI package"};
        console.log(err);
        next();
    });
};

/**
 * Verify Checksums for each attachment
 * Parse aknXml to get attachments info
 * For each attachment, compute checksum 
 * Verify checksum against the value in <an:embeddedContent>
 * Returns a map of attachments validity
 */
const verifyChecksums = (aknXml, pkgFolder) => {
    let attValid = true;
	let doc = new DOMParser().parseFromString(aknXml);
	let atts = doc.getElementsByTagName("an:embeddedContent");
	for (let i = 0; i < atts.length; i++) {
		const attFname = atts[i].getAttribute('file');
        const attChecksum = atts[i].getAttribute('checksum');
		const attFpath = path.resolve(constants.TMP_AKN_FOLDER(), pkgFolder, attFname);
		//To-Do: Make async
		const checksum = md5File.sync(attFpath);
        if (checksum !== attChecksum) {
            attValid[attFname] = false;
            return attValid;
        }
	}
	return attValid;
}

/**
 * Validate the metadata xml
 */
const validateMeta = (docPath) => {
    console.log(" IN: validateMeta");
    const validateApi = servicehelper.getApi("package-sign", "validate");
    const {url, method} = validateApi;

    const pubPath = docPath.replace("xml", "public");
    return filehelper.decodeFile(pubPath, 'base64')
    .then(result => {
        let data = new FormData();
        data.append('sig_file', fs.createReadStream(docPath));
        data.append('public_key', fs.createReadStream(pubPath));

        return axios({
            method: method,
            url: url,
            data: data,
            headers: data.getHeaders()
        });
    })
}

/**
 * Validate pkg.
 * For each attachment in the package, compute and verify checksum within
 * the metadata xml.
 * Validate the signature of the metadata xml.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validatePkg = (req, res, next) => {
    console.log(" IN: validatePkg");
    if (!isError(res.locals.returnResponse)) {
        const pkgFolder = path.basename(res.locals.zipPath, '.zip');
        const dest = constants.TMP_AKN_FOLDER();
        const docPath = getDocPath(res.locals);

        let valid = {"attValid": false, "metaValid": false};

        unzip(res.locals.zipPath, path.resolve(dest))
        .then((result) => {
            return filehelper.readFile(docPath);
        })
        .then((aknXml) => {
            valid["attValid"] = verifyChecksums(aknXml, pkgFolder);

            //Important: Formatting space within the singature tag must be removed
            aknTrimmed = generalhelper.trimSpaceInSignature(aknXml);
            return filehelper.writeFile(aknTrimmed, docPath);
        })
        .then(result => validateMeta(docPath))
        .then(response => {
            if ('valid' in response.data) {
                valid["metaValid"] = response.data['valid'];
            }
            res.locals.returnResponse = valid;
            next();
        })
        .catch((err) => {
            res.locals.returnResponse = {"status": "error", "msg": "Error while validating."};
            console.log(err);
            next();
        })
    } else {
        next();
    }
}

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
    signPkg: signPkg,
    uploadSignedPkg: uploadSignedPkg,
    validatePkg: validatePkg,
    returnResponse: returnResponse
};