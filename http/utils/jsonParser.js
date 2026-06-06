/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file jsonParser.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A helper utility for reading the bodies of POST, PUT, and PATCH requests. 
 * @exports parseJson
 */

import http from 'node:http';

/**
 * @param {http.IncomingMessage} req - The request to parse the body of.
 * @returns {Promise} - Resolves when req.body exist.
 */
export function parseJson(req) {
    return new Promise(resolve => {
        if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return resolve();
        let data = ``;
        req.on(`data`, chunk => data += chunk);
        req.on(`end`, () => {
            try {
                req.body = data ? JSON.parse(data) : {};
            } catch {
                req.body = {};
            }
            resolve();
        });
    });
}