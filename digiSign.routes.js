const ds = require("./digiSign");

/**
 * API stack for each Request end point. 
 * They are called one after the other in the order of the array
 */
var dsAPIs  = {};

/*
Signs the AKN document for a given IRI; 
Posts the signed object (document and public key) to be saved on the database.  
Input object submitted to the API:
"data": {
    "iri": "/akn/ke/act/legge/1970-06-03/Cap_44/eng@/!main"
}
 */
dsAPIs["/sign"] = {
    method: "post",
    stack: [
        ds.receiveSubmitData,
        ds.loadPkgForIri,  
        ds.returnResponse
    ]
};

module.exports.dsAPIs = dsAPIs;