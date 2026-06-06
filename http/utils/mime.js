/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file mime.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A helper utility for converting filetypes to response Content-Types.
 * @exports mimeTypes, getMime
 */

export const mimeTypes = {
    html: `text/html`,
    js: `application/javascript`,
    css: `text/css`,
    json: `application/json`,
    png: `image/png`,
    jpg: `image/jpeg`,
    jpeg: `image/jpeg`,
    svg: `image/svg+xml`,
    txt: `text/plain`
};

/**
 * @param {String} extension - The extension of the file to convert to Content-Type. 
 * @returns A Content-Type representation of the file's extension.
 */
export function getMime(extension) {
    return mimeTypes[extension] || `application/octet-stream`;
}