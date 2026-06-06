/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file sessions.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A helper utility for setting the current session!
 * @exports loadSession
 */

import { setCookie } from './cookies.js';
import http from 'node:http';

/**
 * @param {http.IncomingMessage} req - The client's request
 * @param {http.ServerResponse} res - The server's response
 * @param {Array} sessions - A list of the request's current sessions
 */
export function loadSession(req, res, sessions) {
    const sid = req.cookies.sid;
    if (sid && sessions[sid]) {
        req.session = sessions[sid];
        return;
    }

    const newSid = Math.random().toString(36).slice(2);
    sessions[newSid] = {};
    req.session = sessions[newSid];

    setCookie(res, `sid`, newSid, {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: `/`
    });
}