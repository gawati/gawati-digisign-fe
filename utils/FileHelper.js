const fs = require("fs-extra");
/**
 * Promisified File functions
 */

/**
 * Reads a given file to string.
 */
const readFile = (filename) => {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, "utf8", function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Writes a given string/buffer to file.
 */
const writeFile = (data, filename) => {
  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, data, function(err) {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

/**
 * Decodes an encoded (e.g. base64) file and writes back decoded data 
 * to the same file.
 */
const decodeFile = (path, encoding) => {
  return new Promise(function(resolve, reject) {
    readFile(path)
    .then(data => {
      fs.writeFile(path, data, encoding, function(err) {
        if (err) reject(err);
        else resolve(true);
      })
    })
    .catch(err => reject(err));
  });
}

module.exports = {
  readFile: readFile,
  writeFile: writeFile,
  decodeFile: decodeFile
}