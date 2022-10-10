// Path utility class.
// noinspection DuplicatedCode

const path = require('path');
const https = require('https');
const zlib = require('zlib');

// Read version info of thuisbezorgd-scraper.
const packageJson = require(path.join(__dirname, '..', 'package.json'));

// User agent is based on package name and version and includes the email address.
/** @namespace packageJson.name */
/** @namespace packageJson.version */
/** @namespace packageJson.email */
const USER_AGENT_STRING = `${packageJson.name}/${packageJson.version} (${packageJson.email})`;

const DEBUG_PREFIX = '\x1B[36mDEBUG\x1B[0m: ';

const HOST = 'live-orders-api.takeaway.com';
const THUISBEZORGD_PATH_LOGIN = '/api/sso/auth-by-credentials';
const THUISBEZORGD_PATH_RESTAURANT = '/api/restaurant';
const THUISBEZORGD_PATH_ORDERS = '/api/orders';

// noinspection SpellCheckingInspection
const HTTP_HEADERS = {
    // 'User-Agent': 'liveorders/2 CFNetwork/1390 Darwin/22.0.0',
    'Host': HOST,
    'User-Agent': USER_AGENT_STRING,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip',
    'Accept-Language': 'nl-NL,nl;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Origin': 'https://live-orders.takeaway.com',
    'Referer': 'https://live-orders.takeaway.com',
    'X-Requested-With': 'XMLHttpRequest'
};

/**
 * Login with username and password to receive access token.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise} A promise that resolves with the access token or rejects
 */
function login(configuration) {

    const verbose = configuration.verbose;
    return new Promise((resolveFn, rejectFn) => {

        const thuisbezorgdUsername = configuration.username;
        const thuisbezorgdPassword = configuration.password;

        if (!thuisbezorgdUsername || !thuisbezorgdPassword) {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No username and or password configured, cannot log in to Thuisbezorgd.nl'
            });
            return;
        }

        const postData = JSON.stringify({
            username: thuisbezorgdUsername,
            password: thuisbezorgdPassword
        });

        /** @type {module:http.RequestOptions} */
        const options = {
            agent: false,
            hostname: HOST,
            port: 443,
            path: THUISBEZORGD_PATH_LOGIN,
            method: 'POST',
            headers: {
                ...HTTP_HEADERS,
                'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false
        };

        if (verbose) {
            console.log(`${DEBUG_PREFIX}Login POST request to receive accessToken`);
        }

        const httpRequest = https.request(options, /** @param {module:http.ServerResponse} httpResponse */(httpResponse) => {

            const statusCode = httpResponse.statusCode;
            // noinspection JSUnresolvedVariable
            /** @type {IncomingHttpHeaders} */
            const parsedResponseHeaders = httpResponse.headers;

            const contentType = parsedResponseHeaders['content-type'] || 'Unknown';
            const isJson = contentType.indexOf('application/json') === 0;

            httpResponse = wrapForGzip(parsedResponseHeaders, httpResponse);

            // Receive data and add to buffer.
            const chunks = [];
            httpResponse.on('data', chunk => chunks.push(chunk));

            /**
             * End of response reached.
             */
            httpResponse.on('end', () => {

                const responseData = Buffer.concat(chunks).toString();

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Login response: "${responseData}"`);
                }

                if (statusCode !== 200) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl SSO service failed with status code ${statusCode}, cannot log in to Thuisbezorgd.nl`
                    });
                    return;
                }
                if (!isJson) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl SSO service failed. We expected a JSON response but received "${contentType}", cannot log in to Thuisbezorgd.nl`
                    });
                    return;
                }
                if (!responseData) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl SSO service failed. We expected JSON content but received "${responseData}", cannot log in to Thuisbezorgd.nl`
                    });
                    return;
                }
                try {
                    const accessToken = JSON.parse(responseData)['access_token'];
                    resolveFn(accessToken);
                } catch (e) {
                    if (verbose) {
                        console.log(`${DEBUG_PREFIX}Login error parsing response: "${e}"`);
                    }
                    rejectFn({
                        errorCode: 'PARSE_ERROR',
                        errorMessage: `Thuisbezorgd.nl SSO service failed. We expected a JSON response but received "${responseData}", cannot log in to Thuisbezorgd.nl`
                    });
                }
            });
        })
            .on('error', (error) => {

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Login request error: "${error}"`);
                }

                const errorMessage = error.message || error;
                rejectFn({
                    errorCode: 'HTTP_ERROR',
                    errorMessage: `Thuisbezorgd.nl SSO service request failed. "${errorMessage}", cannot log in to Thuisbezorgd.nl`
                });
            });

        // Write data and finish request to external server.
        httpRequest.write(postData);
        httpRequest.end();
    });
}

/**
 * Get restaurant info.
 * Actually we only need the reference field.
 *
 * @param {string} accessToken
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise} A promise that resolves
 */
function getRestaurant(accessToken, configuration) {

    const verbose = configuration.verbose;
    return new Promise((resolveFn, rejectFn) => {

        if (!accessToken) {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No access token, cannot access Thuisbezorgd.nl API'
            });
            return;
        }

        // https://live-orders-api.takeaway.com/api/restaurant
        /** @type {module:http.RequestOptions} */
        const options = {
            agent: false,
            hostname: HOST,
            port: 443,
            path: THUISBEZORGD_PATH_RESTAURANT,
            method: 'GET',
            headers: {
                ...HTTP_HEADERS,
                'Authorization': `Bearer ${accessToken}`
            },
            rejectUnauthorized: false
        };

        if (verbose) {
            console.log(`${DEBUG_PREFIX}Login GET request to receive restaurant info`);
        }

        const httpRequest = https.request(options, /** @param {module:http.ServerResponse} httpResponse */(httpResponse) => {

            const statusCode = httpResponse.statusCode;
            // noinspection JSUnresolvedVariable
            /** @type {IncomingHttpHeaders} */
            const parsedResponseHeaders = httpResponse.headers;

            const contentType = parsedResponseHeaders['content-type'] || 'Unknown';
            const isJson = contentType.indexOf('application/json') === 0;

            httpResponse = wrapForGzip(parsedResponseHeaders, httpResponse);

            // Receive data and add to buffer.
            const chunks = [];
            httpResponse.on('data', chunk => chunks.push(chunk));

            /**
             * End of response reached.
             */
            httpResponse.on('end', () => {

                const responseData = Buffer.concat(chunks).toString();

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Restaurant request response: "${responseData}"`);
                }

                if (statusCode !== 200) {
                    rejectFn({
                        status: statusCode,
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed with status code ${statusCode}, cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                if (!isJson) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected a JSON response but received "${contentType}", cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                if (!responseData) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected JSON content but received "${responseData}", cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                try {
                    resolveFn(JSON.parse(responseData));
                } catch (e) {
                    rejectFn({
                        errorCode: 'PARSE_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected JSON content but received "${responseData}", cannot access Thuisbezorgd.nl API`
                    });
                }
            });
        })
            .on('error', (error) => {

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Restaurant request error: "${error}"`);
                }

                const errorMessage = error.message || error;
                rejectFn({
                    errorCode: 'HTTP_ERROR',
                    errorMessage: `Thuisbezorgd.nl API service request failed. "${errorMessage}", cannot access Thuisbezorgd.nl API`
                });
            });

        // Finish request to external server.
        httpRequest.end();
    });
}

/**
 * Get orders.
 *
 * @param {string} accessToken Bearer access token
 * @param {string} reference Restaurant reference code
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise} A promise that resolves
 */
function getOrders(accessToken, reference, configuration) {
    const verbose = configuration.verbose;
    return new Promise((resolveFn, rejectFn) => {

        if (!accessToken) {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No access token, cannot access Thuisbezorgd.nl API'
            });
            return;
        }
        if (!reference) {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No restaurant reference, cannot access Thuisbezorgd.nl API'
            });
            return;
        }

        // https://live-orders-api.takeaway.com/api/orders
        /** @type {module:http.RequestOptions} */
        const options = {
            agent: false,
            hostname: HOST,
            port: 443,
            path: THUISBEZORGD_PATH_ORDERS,
            method: 'GET',
            headers: {
                ...HTTP_HEADERS,
                'Authorization': `Bearer ${accessToken}`,
                'X-restaurant-id': reference
            },
            rejectUnauthorized: false
        };

        if (verbose) {
            console.log(`${DEBUG_PREFIX}Login GET request to receive orders`);
        }

        const httpRequest = https.request(options, /** @param {module:http.ServerResponse} httpResponse */(httpResponse) => {

            const statusCode = httpResponse.statusCode;
            // noinspection JSUnresolvedVariable
            /** @type {IncomingHttpHeaders} */
            const parsedResponseHeaders = httpResponse.headers;

            const contentType = parsedResponseHeaders['content-type'] || 'Unknown';
            const isJson = contentType.indexOf('application/json') === 0;

            httpResponse = wrapForGzip(parsedResponseHeaders, httpResponse);

            // Receive data and add to buffer.
            const chunks = [];
            httpResponse.on('data', chunk => chunks.push(chunk));

            /**
             * End of response reached.
             */
            httpResponse.on('end', () => {

                const responseData = Buffer.concat(chunks).toString();

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Orders request response: "${responseData}"`);
                }

                if (statusCode !== 200) {
                    rejectFn({
                        status: statusCode,
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed with status code ${statusCode}, cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                if (!isJson) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected a JSON response but received "${contentType}", cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                if (!responseData) {
                    rejectFn({
                        errorCode: 'HTTP_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected JSON content but received "${responseData}", cannot access Thuisbezorgd.nl API`
                    });
                    return;
                }
                try {
                    resolveFn(JSON.parse(responseData));
                } catch (e) {
                    rejectFn({
                        errorCode: 'PARSE_ERROR',
                        errorMessage: `Thuisbezorgd.nl API service failed. We expected JSON content but received "${responseData}", cannot access Thuisbezorgd.nl API`
                    });
                }
            });
        })
            .on('error', (error) => {

                if (verbose) {
                    console.log(`${DEBUG_PREFIX}Orders request error: "${error}"`);
                }

                const errorMessage = error.message || error;
                rejectFn({
                    errorCode: 'HTTP_ERROR',
                    errorMessage: `Thuisbezorgd.nl API service request failed. "${errorMessage}", cannot access Thuisbezorgd.nl API`
                });
            });

        // Finish request to external server.
        httpRequest.end();
    });
}

/**
 * Pipe through gzip if the contents is gzipped.
 *
 * @param {IncomingHttpHeaders} parsedResponseHeaders Headers object as key-value
 * @param {module:http.ServerResponse} httpResponse HTTP response
 * @returns {module:http.ServerResponse | module:zlib.Gunzip} Piped response
 */
function wrapForGzip(parsedResponseHeaders, httpResponse) {
    const isGzipped = parsedResponseHeaders['content-encoding'] === 'gzip';
    if (isGzipped) {
        // https://stackoverflow.com/questions/29757380/nodejs-returning-garbage-json
        const gzip = zlib.createGunzip();
        httpResponse.pipe(gzip);
        return gzip;
    }
    return httpResponse;
}


// Public functions.

/**
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise<IThuisbezorgdOrder[]>} The orders or an empty list
 */
exports.getOrders = (configuration) => {

    return new Promise((resolveFn, rejectFn) => {
        login(configuration)
            .then(accessToken => {
                // Call restaurant API, to receive the reference.
                getRestaurant(accessToken, configuration)
                    .then(/** @param {{reference:string}} result */result => {
                        if (!result || !result.reference) {
                            rejectFn('Unable to receive restaurant reference, cannot get orders.');
                            return;
                        }
                        const reference = result.reference;
                        getOrders(accessToken, reference, configuration)
                            .then(orders => {
                                resolveFn(orders);
                            })
                            .catch(error => {
                                rejectFn(error);
                            });
                    })
                    .catch(error => {
                        rejectFn(error);
                    });

            })
            .catch(error => {
                rejectFn(error);
            });
    });
};
