const path = require('path');
const thuisbezorgdService = require(path.join(__dirname, 'thuisbezorgd-services'));

// make scrape() public available.
exports.scrape = scrape;


/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {Object} configuration Configuration object with the properties 'username', 'password', 'debug' (optional) and 'verbose' (optional)
 * @param {string} configuration.username Username
 * @param {string} configuration.password Password
 * @param {boolean} [configuration.debug] If true, show debugging info
 * @param {boolean} [configuration.verbose] If true, show verbose logging
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function scrape(configuration) {
    return thuisbezorgdService.getOrders(configuration);
}

