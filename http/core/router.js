/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file router.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A core file responsible for handling web routing!  
 * @exports matchRoute, matchSubdomain
 */

/**
 * @param {String} sub - The subdomain 
 * @param {Object} table - The subdomain's routing table 
 * @returns {String} The subdomain's matched key
 */
export function matchSubdomain(sub, table) {
    if (!sub) return null;
    if (table[sub]) return sub;
    if (table[`*`]) return `*`;
    return null;
}

/**
 * @param {Array<String>} routes - A list of routes to filter. 
 * @param {String} method - What method should go with the routes?
 * @param {String} pathName - Where should the routes be reached?
 * @returns {{handler: Function, params: Object}}
 */
export function matchRoute(routes, method, pathName) {
    const list = routes[method] || [];
    for (const route of list) {
        const routeParts = route.path.split(`/`).filter(Boolean);
        const pathParts = pathName.split(`/`).filter(Boolean);
        if (routeParts.length !== pathParts.length) continue;
        let params = {};
        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(`:`)) {
                params[routeParts[i].slice(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                match = false;
                break;
            }
        }

        if (match) return { 
            handler: route.handler, 
            params 
        };
    }
    return null;
}