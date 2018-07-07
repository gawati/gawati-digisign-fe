/**
 * Generates a normalized file name from a FRBRExpression/FRBRthis/@value iri
 */
const fileNameFromIRI = (iri, fileType) => {
    let filePrefix = fileNamePrefixFromIRI(iri);
    return `${filePrefix}.${fileType}`;
};

const fileNamePrefixFromIRI = (iri) => {
    let iriArr = iri.split("/");
    iriArr.shift();
    let filePrefix = iriArr.map(
        (item) => {
            if (item.indexOf("@") !== -1) {
                if (item.endsWith("@")) {
                    return item.replace("@", "");
                } else {
                    return item.replace("@", "_");
                } 
            } else {
                return item.replace("!", "");
            }
        }
    ).join("_");
    return filePrefix;
};

module.exports = {
  fileNameFromIRI: fileNameFromIRI
}