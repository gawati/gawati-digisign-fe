/**
 * Extract the filename from Content-Disposition
 * filename[^;\n=]*=(['\"])*(.*)(?(1)\1|)
 * filename        # match filename, followed by
 * [^;=\n]*        # anything but a ;, a = or a newline =
 * (['"])*         # either single or double quote, put it in capturing group 1
 * (?:utf-8\'\')?  # removes the utf-8 part from the match
 * (.*)            # second capturing group, will contain the filename
 * (?(1)\1|)       # if clause: if first capturing group is not empty,
 *                 # match it again (the quotes), else match nothing
 * The filename is in the second capturing group.
 */
const fnameFromResponse = (response) => {
    let regexp = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;    
    let filename = regexp.exec(response.headers['content-disposition'])[1];
    return filename;
};

/**
 * Trims whitespaces between the `Signature` tags in the metadata xml
 * Note: The space between </Signature> and the root tag must 
 * also be removed for the Signature to be valid. 
 * <gwd:package> is assumed to be the root tag.
 */
const trimSpaceInSignature = (aknXml) => {
    return aknXml.replace(/<Signature[^>]*>([\s\S]*?)<\/gwd:package>/, function(match) {
        return match.replace(/>\s+</g, "><")
    });
}

module.exports = {
    fnameFromResponse: fnameFromResponse,
    trimSpaceInSignature: trimSpaceInSignature
};