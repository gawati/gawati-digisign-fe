# Digital Sign Frontend Component for Gawati Package Sign

The Gawati Package Sign module allows digitally signing and validating documents. This service provides APIs for the user to sign and validate a document.

## Install
```
npm install
``` 

## Run
```
node ./bin/www
```

### Dependencies
1. The keys for signing a document are assumed to be stored locally.
2. The public key for validating a document is received as part of the package.
3. The following components need to be started, in the given order, prior to gawati-digisign-fe:
    - gawati-editor-fe
    - gawati-package-sign

### Config
1. Port: The default port is set to 9010.
2. Package path: This is set in `constants.js` and refers to the filesystem path where packages received are stored. 
3. Keys path: This is set in `constants.js` and refers to the filesystem path where signature keys stored.
4. Service end points: Endpoints for talking to gawati-editor-fe and gawati-package-sign. Set in `configs/dataServer.json`.  


## Sign Document API

Request URL: http://localhost:9010/gwds/sign  
Method: POST  
Content-Type: application/json  
Request body: `iri: <Document IRI>`  
Response: response json `{ success/error: <message>}`

- User submits IRI of the document to be signed.
- The document package, composed of XML metadata and attachments is fetched from gawati-editor-fe.
- For each attachment, checksum is computed and embedded into the XML metadata.
- The updated XML metadata and the keys (public and private) are sent to gawati-package-sign be signed. The keys are assumed to be local and in binary DER format.
- The signed XML metadata and the public key used for this instance of signing is sent to gawati-editor-fe to be saved on the database. The signature is inserted within the root tag of the XML metadata.


## Validate Document API

Request URL: http://localhost:9010/gwds/validate  
Method: POST  
Content-Type: application/json  
Request body: `iri: <Document IRI>`  
Response: response json `{attValid: Boolean, metaValid: Boolean}`

- User submits IRI of the document to be validated.
- The document package, composed of XML metadata, attachments, and the public key is fetched from gawati-editor-fe.
- For each attachment, checksum is computed and compared against checksum embedded in the signed XML metadata. If any of the checksums don't match, the package is deemed invalid.
- The public key fetched from the editor is decoded to its binary representation.
- The signed XML metadata, along with the decoded public key is sent to gawati-package-sign be validated.
- The validity of the XML metadata and its attachments is returned.

### Notes:
- Public key encoding and decoding  
    - Both, private and public keys are stored in binary DER format locally. gawati-package-sign expects the keys to be DER format.
    - The public key sent along with the signed XML gets saved in `base64` encoded format in the database.
    - Consequently, when the public key is fetched for the validate cycle, it gets decoded back to its binary representation before it is sent to gawati-package-sign. 
- For an attachment, we do not embed a signature into it, since the format or nature of the document is not predictable. The validity of attachments is captured by checksum comparison and the validity of the signed metadata (which has attachment checksums embedded in it). 

**IMPORTANT**  
To reiterate:
- For sign, the locally stored keys (already in DER) are used. These are a user's personal keys.
- For validate, the public key fetched from the database is decoded into its binary format and then posted to gawati-package-sign.

### Generating Compatible Keys
Keys accepted by the gawati-package-sign can be generated using ssh-keygen:
```
ssh-keygen -b 1024 -t dsa
```
and then convertd to pkcs8 format:
```
openssl pkcs8 -topk8 -inform PEM -outform DER -in private_key_file  -nocrypt > pkcs8_key
```