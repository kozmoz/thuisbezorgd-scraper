// Path utility class.
const path = require("path");
const https = require("https");
const zlib = require("zlib");

// Read version info of thuisbezorgd-scraper.
const packageJson = require(path.join(__dirname, "..", "package.json"));

// User agent is based on package name and version and includes the email address.
/** @namespace packageJson.name */
/** @namespace packageJson.version */
/** @namespace packageJson.email */
const USER_AGENT_STRING = `${packageJson.name}/${packageJson.version} (${packageJson.email})`;
// const USER_AGENT_STRING = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15";

const HTTP_METHOD_OPTIONS = "OPTIONS";
const HTTP_METHOD_POST = "POST";
const HTTP_METHOD_PATCH = "PATCH";
const HTTP_METHOD_GET = "GET";
const HTTP_METHODS = [HTTP_METHOD_OPTIONS, HTTP_METHOD_POST, HTTP_METHOD_PATCH, HTTP_METHOD_GET];

const DEBUG_PREFIX = "\x1B[36mDEBUG\x1B[0m: ";

const HOST = "live-orders-api.takeaway.com";
const THUISBEZORGD_PATH_LOGIN = "/api/sso/auth-by-credentials";
const THUISBEZORGD_PATH_RESTAURANT = "/api/restaurant";
const THUISBEZORGD_PATH_ORDERS = "/api/orders";
const THUISBEZORGD_PATH_ORDER = THUISBEZORGD_PATH_ORDERS + "/{id}";
const THUISBEZORGD_PATH_CONFIRM_ORDER = THUISBEZORGD_PATH_ORDER + "/confirm-order";
const THUISBEZORGD_PATH_RECEIVED = THUISBEZORGD_PATH_ORDER + "/mark-as-received";

const STATUS_CONFIRMED = "confirmed";
const STATUS_KITCHEN = "kitchen";
const STATUS_IN_DELIVERY = "in_delivery";
const STATUS_DELIVERED = "delivered";
const STATUSES = [STATUS_CONFIRMED, STATUS_KITCHEN, STATUS_IN_DELIVERY, STATUS_DELIVERED];

const DEFAULT_FOOD_PREPARATION_DURATION = 15;
const DEFAULT_DELIVERY_TIME_DURATION = 30;

// General headers.
// noinspection SpellCheckingInspection
const HTTP_HEADERS = {
  host: HOST,
  accept: "application/json, text/plain, */*",
  "sec-fetch-site": "same-site",
  "accept-language": "nl-NL,nl;q=0.9",
  "sec-fetch-mode": "cors",
  "accept-encoding": "gzip",
  origin: "https://live-orders.takeaway.com",
  "user-agent": USER_AGENT_STRING,
  referer: "https://live-orders.takeaway.com/",
  "sec-fetch-dest": "empty"
};

/**
 * Login with username and password to receive access token.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise<string|IResponseError>} A promise that resolves with the access token or rejects
 */
function login(configuration) {

  const verbose = configuration.verbose;
  return new Promise((resolveFn, rejectFn) => {

    const thuisbezorgdUsername = configuration.username;
    const thuisbezorgdPassword = configuration.password;

    if (!thuisbezorgdUsername || !thuisbezorgdPassword) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No username and or password configured, cannot log in to Thuisbezorgd.nl"
      });
      return;
    }

    const postData = JSON.stringify({
      username: thuisbezorgdUsername,
      password: thuisbezorgdPassword
    });

    // https://live-orders-api.takeaway.com/api/restaurant
    sendHttpRequest(HTTP_METHOD_POST, "", THUISBEZORGD_PATH_LOGIN, 0, "", postData, verbose, (responseData => {
      try {
        resolveFn(JSON.parse(responseData)['access_token']);
      } catch (e) {
        rejectFn({
          errorCode: "PARSE_ERROR",
          errorMessage: `Could not parse the response: ${e}`
        });
      }
    }), rejectFn);
  });
}

/**
 * Get restaurant info.
 * Actually we only need the reference field.
 *
 * @param {string} accessToken
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise<{reference:string}|IResponseError>} A promise that resolves
 */
function getRestaurant(accessToken, configuration) {

  const verbose = configuration.verbose;
  return new Promise((resolveFn, rejectFn) => {

    if (!accessToken) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No access token, cannot access Thuisbezorgd.nl API"
      });
      return;
    }

    // https://live-orders-api.takeaway.com/api/restaurant
    sendHttpRequest(HTTP_METHOD_GET, "", THUISBEZORGD_PATH_RESTAURANT, 0, accessToken, "", verbose, (responseData => {
      try {
        resolveFn(JSON.parse(responseData));
      } catch (e) {
        rejectFn({
          errorCode: "PARSE_ERROR",
          errorMessage: `Could not parse the response: ${e}`
        });
      }
    }), rejectFn);
  });
}

/**
 * Get orders.
 *
 * @param {string} accessToken Bearer access token
 * @param {number} restaurantId Restaurant reference code
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise<IThuisbezorgdOrder[]|IResponseError>} A promise that resolves
 */
function getOrders(accessToken, restaurantId, configuration) {
  const verbose = configuration.verbose;
  return new Promise((resolveFn, rejectFn) => {

    if (!accessToken) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No access token, cannot access Thuisbezorgd.nl API"
      });
      return;
    }
    if (!restaurantId) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No restaurant reference, cannot access Thuisbezorgd.nl API"
      });
      return;
    }

    // Always two requests, one OPTIONS and the POST request
    sendHttpRequest(HTTP_METHOD_OPTIONS, HTTP_METHOD_GET, THUISBEZORGD_PATH_ORDERS, restaurantId, accessToken, "", verbose, () => {
      // Options was successful, now the POST
      sendHttpRequest(HTTP_METHOD_GET, "", THUISBEZORGD_PATH_ORDERS, restaurantId, accessToken, "", verbose, (responseData => {
        try {
          resolveFn(JSON.parse(responseData));
        } catch (e) {
          rejectFn({
            errorCode: "PARSE_ERROR",
            errorMessage: `Could not parse the response: ${e}`
          });
        }
      }), rejectFn);
    }, rejectFn);
  });
}

/**
 * Update the order status.
 *
 * @param {string} accessToken Bearer access token
 * @param {number} restaurantId Restaurant reference code
 * @param {number} orderId Thuisbezorgd order id
 * @param {boolean} [verbose] If true, log details. False by default (optional parameter)
 * @return {Promise<void|IResponseError>} A promise that resolves
 */
function markAsReceived(accessToken, restaurantId, orderId, verbose = false) {
  return new Promise((resolveFn, rejectFn) => {

    if (!accessToken) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No access token, cannot access Thuisbezorgd.nl API"
      });
      return;
    }
    if (!restaurantId) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No restaurant reference, cannot access Thuisbezorgd.nl API"
      });
      return;
    }
    if (!orderId) {
      rejectFn({
        errorCode: "NO_ORDER_ID",
        errorMessage: "No order id, cannot update the order status"
      });
      return;
    }

    // https://live-orders-api.takeaway.com/api/orders/9775233291/mark-as-received
    const path = THUISBEZORGD_PATH_RECEIVED.replace("{id}", `${orderId}`);
    // Always two requests, one OPTIONS and the POST request
    sendHttpRequest(HTTP_METHOD_OPTIONS, HTTP_METHOD_POST, path, restaurantId, accessToken, "", verbose, () => {
      // Options was successful, now the POST
      sendHttpRequest(HTTP_METHOD_POST, "", path, restaurantId, accessToken, "", verbose, resolveFn, rejectFn);
    }, rejectFn);
  });
}

/**
 * Update the order status.
 *
 * @param {string} accessToken Bearer access token
 * @param {number} restaurantId Restaurant reference code
 * @param {number} orderId Thuisbezorgd order id
 * @param {"confirmed"|"kitchen"|"in_delivery"|"delivered"} status New status
 * @param {number} [foodPreparationDuration] food_preparation_duration in minutes, defaults to 15
 * @param {number} [deliveryTimeDuration] delivery_time_duration in minutes, defaults to 30
 * @param {boolean} [verbose] If true, log details. False by default (optional parameter)
 * @return {Promise<void|IResponseError>} A promise that resolves
 */
function updateStatus(accessToken, restaurantId, orderId, status, foodPreparationDuration, deliveryTimeDuration, verbose = false) {
  return new Promise((resolveFn, rejectFn) => {

    if (!accessToken) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No access token, cannot access Thuisbezorgd.nl API"
      });
      return;
    }
    if (!restaurantId) {
      rejectFn({
        errorCode: "NO_CREDENTIALS",
        errorMessage: "No restaurant reference, cannot access Thuisbezorgd.nl API"
      });
      return;
    }
    if (!orderId) {
      rejectFn({
        errorCode: "NO_ORDER_ID",
        errorMessage: "No order id, cannot update the order status"
      });
      return;
    }
    if (!STATUSES.includes(status)) {
      rejectFn({
        errorCode: "INVALID_STATUS",
        errorMessage: `Cannot update the order status, the status "${status}" is invalid. Valid statuses: ${JSON.stringify(STATUSES)}`
      });
      return;
    }

    let path;
    let postData;
    let method;

    // Confirm action or only a status update.
    if (status === STATUS_CONFIRMED) {
      path = THUISBEZORGD_PATH_CONFIRM_ORDER.replace("{id}", `${orderId}`);
      method = HTTP_METHOD_POST;
      postData = JSON.stringify({
        food_preparation_duration: foodPreparationDuration || DEFAULT_FOOD_PREPARATION_DURATION,
        delivery_time_duration: deliveryTimeDuration || DEFAULT_DELIVERY_TIME_DURATION
      });
    } else {
      path = THUISBEZORGD_PATH_ORDER.replace("{id}", `${orderId}`);
      method = HTTP_METHOD_PATCH;
      postData = JSON.stringify({status});
    }

    // Always two requests, one OPTIONS and the POST request
    sendHttpRequest(HTTP_METHOD_OPTIONS, method, path, restaurantId, accessToken, "", verbose, () => {
      // Options was successful, now the POST
      sendHttpRequest(method, "", path, restaurantId, accessToken, postData, verbose, resolveFn, rejectFn);
    }, rejectFn);
  });
}

/**
 * Pipe through gzip if the contents is gzipped.
 *
 * @param {module:http.ServerResponse} httpResponse HTTP response
 * @param {boolean} verbose
 * @returns {module:http.ServerResponse | module:zlib.Gunzip} Piped response
 */
function wrapForGzip(httpResponse, verbose = false) {
  const isGzipped = httpResponse.headers["content-encoding"] === "gzip";
  if (isGzipped) {
    if (verbose) {
      console.log("Response is gzip-encoded.");
    }
    // https://stackoverflow.com/questions/29757380/nodejs-returning-garbage-json
    const gzip = zlib.createGunzip();
    httpResponse.pipe(gzip);
    return gzip;
  }
  return httpResponse;
}

/**
 * Sends an HTTP request to the specified path using the provided method.
 *
 * @param {string} method - The HTTP method to use for the request
 * @param {string} nextMethod - The HTTP method to use for the next request (only used in case of OPTIONS
 * @param {string} path - The URL path for the request, starting with /
 * @param {number} restaurantId - The Thuisbezorgd ID of the restaurant
 * @param {string} accessToken - The access token for authentication (Bearer)
 * @param {string} postData - The data to be sent in the request body, or an empty string
 * @param {boolean} verbose - Determines whether to log verbose information
 * @param {Function} resolveFn - The function to call if the request is resolved
 * @param {Function} rejectFn - The function to call if the request is rejected
 * @return {void}
 */
function sendHttpRequest(method, nextMethod, path, restaurantId, accessToken, postData, verbose, resolveFn, rejectFn) {

  if (verbose) {
    console.log(`${DEBUG_PREFIX}${method} request to ${path}`);
  }

  if (!HTTP_METHODS.includes(method)) {
    rejectFn({
      errorCode: "INVALID_HTTP_METHOD",
      errorMessage: `The requested HTTP method is not supported "${method}", should be one of ${HTTP_METHODS.join(",")}`
    });
    return;
  }
  if (method === HTTP_METHOD_OPTIONS && !HTTP_METHODS.includes(nextMethod)) {
    rejectFn({
      errorCode: "INVALID_HTTP_METHOD",
      errorMessage: `The requested HTTP nextMethod is required "${nextMethod}", should be one of ${HTTP_METHODS.join(",")}`
    });
    return;
  }
  if (path !== THUISBEZORGD_PATH_LOGIN && path !== THUISBEZORGD_PATH_RESTAURANT && !restaurantId) {
    rejectFn({
      errorCode: "RESTAURANT_ID_REQUIRED",
      errorMessage: "The restaurantId is required"
    });
    return;
  }
  if (path !== THUISBEZORGD_PATH_LOGIN && !accessToken) {
    rejectFn({
      errorCode: "ACCESS_TOKEN_REQUIRED",
      errorMessage: "The accessToken is required"
    });
  }

  const headers = {
    ...HTTP_HEADERS
  };

  if (method === HTTP_METHOD_OPTIONS) {
    headers["accept"] = "*/*";
    headers["access-control-request-method"] = nextMethod;
    // Actually "content-type" is not in the "mark-as-received"-call.
    headers["access-control-request-headers"] = "authorization,content-type,x-requested-with" + (restaurantId ? ",x-restaurant-id" : "");
    headers["content-length"] = "0";
  }
  if (method === HTTP_METHOD_POST || method === HTTP_METHOD_PATCH || method === HTTP_METHOD_GET) {
    if (accessToken) {
      headers["authorization"] = `Bearer ${accessToken}`;
    }
    if (restaurantId) {
      headers["x-restaurant-id"] = `${restaurantId}`;
    }
    headers["x-requested-with"] = "XMLHttpRequest";
  }
  if (method === HTTP_METHOD_POST || method === HTTP_METHOD_PATCH) {
    const byteLength = Buffer.byteLength(postData);
    if (byteLength) {
      headers["content-type"] = "application/json";
    }
    headers["content-length"] = `${byteLength}`;
  }

  /** @type {module:http.RequestOptions} */
  const options = {
    // An Agent is responsible for managing connection persistence and reuse for HTTP clients.
    // False creates a new agent just for this one request
    agent: false,
    hostname: HOST,
    port: 443,
    path,
    method,
    headers,
    rejectUnauthorized: false
  };

  const httpRequest = https.request(options, /** @param {module:http.ServerResponse} httpResponse */(httpResponse) => {

    const statusCode = httpResponse.statusCode;
    httpResponse = wrapForGzip(httpResponse, verbose);

    // Receive data and add to buffer.
    const chunks = [];
    httpResponse.on("data", chunk => chunks.push(chunk));

    /**
     * End of response reached.
     */
    httpResponse.on("end", () => {

      const responseData = Buffer.concat(chunks).toString();

      if (verbose) {
        console.log(`${DEBUG_PREFIX}${method} ${path} request response: "${responseData}"`);
      }

      if (statusCode < 200 || statusCode >= 300) {
        rejectFn({
          errorCode: "HTTP_ERROR",
          errorMessage: `Thuisbezorgd.nl API service failed with status code ${statusCode}, cannot access ${method} ${path}`,
          httpStatusCode: statusCode
        });
        return;
      }
      // Status code 200, so successful.
      resolveFn(responseData);
    });
  })
    .on("error", (error) => {

      if (verbose) {
        console.log(`${DEBUG_PREFIX}${method} ${path} request error: "${error}"`);
      }

      const errorMessage = error.message || error || "";
      rejectFn({
        errorCode: isConnectionError(errorMessage) ? "HTTP_ERROR_CONNECTION" : "HTTP_ERROR",
        errorMessage: `Thuisbezorgd.nl API service request failed. "${errorMessage}", cannot access ${method} ${path}`
      });
    });

  // Write data and finish request to external server.
  httpRequest.write(postData);
  httpRequest.end();
}

/**
 * Determines if the given error message indicates a connection error.
 *
 * @param {string} errorMessage - The error message to check.
 * @returns {boolean} - Returns true if the error message indicates a connection error, false otherwise.
 */
function isConnectionError(errorMessage) {
  const CONNECTION_ERROR_MESSAGES = ["socket hang up", "ECONNRESET", "SSLV3_ALERT_HANDSHAKE_FAILURE"];
  return CONNECTION_ERROR_MESSAGES.some(err => (errorMessage || "").includes(err)
  );
}

// Public functions.

/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object
 * @return {Promise<IThuisbezorgdOrder[]|IResponseError>} The orders or an empty list
 */
exports.getOrders = configuration => {
  return new Promise((resolveFn, rejectFn) => {
    login(configuration)
      .then(accessToken => {
        // Call restaurant API, to receive the reference.
        getRestaurant(accessToken, configuration)
          .then(/** @param {{reference:string}} result */result => {
            if (!result || !result.reference) {
              rejectFn("Unable to receive restaurant reference, cannot get orders.");
              return;
            }
            const restaurantId = +result.reference;
            getOrders(accessToken, restaurantId, configuration)
              .then(resolveFn)
              .catch(rejectFn);
          })
          .catch(rejectFn);
      })
      .catch(rejectFn);
  });
};

/**
 * Update status of given order.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object with the properties
 *        'username', 'password' and 'verbose' (optional)
 * @param {number} orderId Thuisbezorgd order id
 * @param {"confirmed"|"kitchen"|"in_delivery"|"delivered"} status New status
 * @param {number} [foodPreparationDuration] food_preparation_duration in minutes
 * @param {number} [deliveryTimeDuration] delivery_time_duration in minutes
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
exports.updateStatus = (configuration, orderId, status, foodPreparationDuration, deliveryTimeDuration) => {
  return new Promise((resolveFn, rejectFn) => {
    login(configuration)
      .then(accessToken => {
        // Call restaurant API, to receive the reference.
        getRestaurant(accessToken, configuration)
          .then(/** @param {{reference:string}} result */result => {
            if (!result || !result.reference) {
              rejectFn("Unable to receive restaurant reference, cannot update status.");
              return;
            }
            const restaurantId = +result.reference;

            // Do we have to call "markAsReceived" first?
            let firstAction = Promise.resolve();
            if (status === STATUS_CONFIRMED) {
              firstAction = markAsReceived(accessToken, restaurantId, orderId, configuration.verbose);
            }
            firstAction
              .then(() => {
                updateStatus(accessToken, restaurantId, orderId, status, foodPreparationDuration, deliveryTimeDuration, configuration.verbose)
                  .then(resolveFn)
                  .catch(rejectFn);
              })
              .catch(rejectFn);
          })
          .catch(rejectFn);
      })
      .catch(rejectFn);
  });
};

// For testing purposes.
exports._isConnectionError = isConnectionError;
exports._updateStatus = updateStatus;
