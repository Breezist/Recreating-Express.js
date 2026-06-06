/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file cookies.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A helper utility for reading and writing cookies during server requests!
 * @exports parseCookies, setCookies
 */

import http from 'node:http';

/**
 * @param {http.IncomingMessage} req - The request to read the cookies from.
 * @returns {Object} An Object array with the cookies.
 */
export function parseCookies(req) {
    const header = req.headers.cookie || ``;
    const cookies = {};
    header.split(`;`).forEach(pair => {
        const [key, value] = pair.trim().split(`=`);
        if (key) cookies[key] = decodeURIComponent(value);
    });
    return cookies;
}

/**
 * @param {http.ServerResponse} res - The response to set the cookies of. 
 * @param {String} name - The name of the cookie.
 * @param {String} value - The value of the cookie.
 * @param {Object} options - maxAge (int, in seconds), httpOnly (whether it should be for http: protocols), path (string), and sameSite (only usable on the same site it was set on) 
 */
export function setCookie(res, name, value, options = {}) {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
    if (options.httpOnly) cookie += `; HttpOnly`;
    if (options.path) cookie += `; Path=${options.path}`;
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
    const existing = res.getHeader(`Set-Cookie`);
    const list = Array.isArray(existing) ? existing : existing ? [existing] : [];
    list.push(cookie);
    res.setHeader(`Set-Cookie`, list);
}