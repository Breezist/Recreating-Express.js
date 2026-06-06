/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file static.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A helper utility for retrieving static pages (pages at a file's directory) 
 * @exports tryStatic
 */

import fs from 'node:fs';
import path from 'node:path';
import {getMime} from './mime.js';
import http from 'node:http';

/**
 * @param {http.IncomingMessage} req - The client's request
 * @param {http.ServerResponse} res - The server's response
 * @param {Array} staticDirs - The directories to attempt to load
 * @returns {Boolean} A boolean representing whether the attempt was successful or not.
 */
export function tryStatic(req, res, staticDirs) {
    for (const dir of staticDirs) {
        const filePath = path.join(dir, req.pathname);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).slice(1);
            res.writeHead(200, {'Content-Type': getMime(ext)});
            fs.createReadStream(filePath).pipe(res);
            return true;
        }
    }
    return false;
}