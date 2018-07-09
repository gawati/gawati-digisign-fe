const path = require("path");
const API_PROTOCOL = process.env.API_PROTOCOL || 'http' ;
const API_HOST = process.env.API_HOST || 'localhost' ;
const API_PORT = process.env.API_PORT || '8080' ;

/** Folders */
const CONFIG_FOLDER = () => 'configs';
const TMP_AKN_FOLDER = () => path.join(".", "tmp");

const SIGN_KEYS_PATH = {
    "public": path.join(".", "sig_keys", "id.public"),
    "private": path.join(".", "sig_keys", "id.private")
}

const API_SERVER_BASE = () =>
    API_PROTOCOL + '://' + API_HOST + ":" + API_PORT + '/exist/restxq';

const PROCESS_NAME = "GAWATI-DIGISIGN-FE";

// see http://schema.akomantoso.com/index.html?type=element&item=akomaNtoso
const AKN_DOC_TYPES = [
    "amendmentList",
    "officialGazette", 
    "documentCollection", 
    "act", 
    "bill", 
    "debateReport", 
    "debate",
    "statement",
    "amendment",
    "judgment",
    "portion",
    "doc" 
];

module.exports = {
    CONFIG_FOLDER: CONFIG_FOLDER,
    API_SERVER_BASE: API_SERVER_BASE,
    TMP_AKN_FOLDER: TMP_AKN_FOLDER,
    SIGN_KEYS_PATH: SIGN_KEYS_PATH,
    AKN_DOC_TYPES: AKN_DOC_TYPES,
    PROCESS_NAME: PROCESS_NAME
};