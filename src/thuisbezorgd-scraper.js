const path = require("path");
const thuisbezorgdService = require(path.join(__dirname, "thuisbezorgd-services"));

// make public available.
exports.scrape = scrape;
exports.updateStatus = updateStatus;


/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object with the properties
 * 'username', 'password' and 'verbose' (optional)
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function scrape(configuration) {
  return thuisbezorgdService.getOrders(configuration);
}

/**
 * Update status of given order.
 *
 * @param {{username:string,password:string,verbose?:boolean}} configuration Configuration object with the properties
 * 'username', 'password' and 'verbose' (optional)
 * @param {number} orderId Thuisbezorgd order id
 * @param {"confirmed"|"kitchen"|"in_delivery"|"delivered"} status New status
 * @param {number} [foodPreparationDuration] food_preparation_duration in minutes
 * @param {number} [deliveryTimeDuration] delivery_time_duration in minutes
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function updateStatus(configuration, orderId, status, foodPreparationDuration, deliveryTimeDuration) {
  return thuisbezorgdService.updateStatus(configuration, orderId, status, foodPreparationDuration, deliveryTimeDuration);
}
