// 'Request' package to handle the https communication.
// https://www.npmjs.com/package/request
// Execute http requests.
const request = require('request');
// path utility class
const path = require('path');
// Date manipulation library.
const moment = require('moment');
// Handle request cookies.
const Cookie = require('request-cookies').Cookie;

// Fast, flexible & lean implementation of core jQuery designed specifically for the server.
// https://github.com/cheeriojs/cheerio
const cheerio = require('cheerio');
// Read version info of thuisbezorgd-scraper.
const packageJson = require(path.join(__dirname, '..', 'package.json'));


const USER_AGENT_STRING = `${packageJson.name}/${packageJson.version} (${packageJson.email})`;

// Thuisbezorgd.nl URLs.
const urlMain = 'https://orders.takeaway.com/';
const urlOrders = 'https://orders.takeaway.com/orders/orders';
const urlDetails = 'https://orders.takeaway.com/orders/details';

/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {Object} configuration Configuration object
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function getOrders(configuration) {

    // Show console logging output?
    const debug = configuration.debug;
    const verbose = configuration.verbose;

    return new Promise((resolveFn, rejectFn) => {

        const thuisbezorgdUsername = configuration.thuisbezorgdUsername;
        const thuisbezorgdPassword = configuration.thuisbezorgdPassword;

        if (!thuisbezorgdUsername || !thuisbezorgdPassword || thuisbezorgdUsername === 'test') {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No username and or password configured, cannot log in to Thuisbezorgd.nl'
            });
            return;
        }

        // Return demo data in case of --debug flag.
        if (debug) {
            const demoData = [{
                'id': 'NPPP75771O',
                'orderCode': 'ELMNZX',
                'time': '17:13',
                'timeDelivery': '17:45',
                'amount': '39.45',
                'city': 'Nijverdal',
                'address': '7443ZM, Prins Hendrikstraat 19',
                'delivery': 'DELIVERY',
                'paid': 'Paid electronically',
                'name': 'Janneke',
                'phoneNumber': '0653830123'
            }, {
                'id': 'NPPP757711',
                'orderCode': 'ELMNZY',
                'time': '19:50',
                'timeDelivery': '20:30',
                'amount': '10.00',
                'city': 'Nijverdal',
                'address': '7443BT, Grotestraat 222',
                'delivery': 'PICKUP',
                'paid': 'Customer pays in cash',
                'name': 'Piet',
                'phoneNumber': '0653830124'
            }];

            setTimeout(() => resolveFn(demoData), 1000 /* Simulate loading time. */);
            return;
        }

        // Call the real Thuisbezorgd.nl service.
        const headersGet = {
            'Host': 'orders.takeaway.com',
            'User-Agent': USER_AGENT_STRING,
            'Accept': 'text/html',
            'Accept-Language': 'en-US'
        };

        // POST headers.
        // GET headers will be added to POST headers later.
        const headersPost = {
            'Cookie': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://orders.takeaway.com',
            'Referer': 'https://orders.takeaway.com/'
        };

        // Add POST headers with GET headers.
        Object.assign(headersPost, headersGet);


        // First GET to get the session cookie and secret request key.
        request.get({url: urlMain, headers: headersGet}, (error, response, html) => {

            if (verbose) {
                console.log('First GET cookie response: ' + JSON.stringify(response.headers['set-cookie']));
            }

            // Error.
            if (error) {
                rejectFn('Accessing url ' + urlMain + ' to start session failed: ' + JSON.stringify(error));
                return;
            }

            if (response.statusCode !== 200) {
                rejectFn('Accessing url ' + urlMain + ' to start session failed with status code: ' + response.statusCode);
                return;
            }

            // Get the time? key.
            const $ = cheerio.load(html);
            const key = $('input[name="key"]').val();

            // Get the session cookie.
            const rawCookies = response.headers['set-cookie'];
            const cookies = rawCookies.map(cookie => {
                const cookieObj = new Cookie(cookie);
                return `${cookieObj.key}=${cookieObj.value}`;
            });

            // Update HTTP headers with sessions cookie.
            headersPost.Cookie = cookies.join(';');

            if (verbose) {
                console.log('HTML headers of login POST: ', JSON.stringify(headersPost));
            }

            // Login request
            request.post({
                url: urlMain,
                headers: headersPost,
                form: {
                    key,
                    login: true,
                    language: 'en',
                    username: thuisbezorgdUsername,
                    password: thuisbezorgdPassword
                }
            }, (error, response) => {

                if (verbose) {
                    console.log('Login statusCode: ' + response.statusCode);
                }

                // Error.
                if (error) {
                    rejectFn('Accessing url ' + urlMain + ' to login failed: ' + JSON.stringify(error));
                    return;
                }

                // The log-in was probably successful.

                // Start new request to get all orders.
                request.get({
                    url: urlOrders,
                    headers: headersPost
                }, (error, response, html) => {

                    if (verbose) {
                        console.log('HTML GET: ', html);
                    }

                    const $ = cheerio.load(html);
                    const message = $('p.list').text();

                    // No orders, resolve with empty array.
                    if (message.indexOf('No orders yet') !== -1) {
                        if (verbose) {
                            console.log('Found the "No orders yet" label, so we assume there are no orders');
                        }
                        resolveFn([]);
                        return;
                    }

                    // Parse HTML for orders.
                    const orders = parseOrderListHtml(html);

                    // Always resolves
                    updateWithDetails(urlDetails, orders, headersPost, resolveFn, verbose);
                });
            });
        });
    });
};


/**
 * Parse the given HTML get the list of current orders.
 * An order contains an id, status, time, delivery time, order code, city, amount, address, distance, etc.
 *
 * @param {String} html Raw HTML of orders page
 * @return {[]} Array with objects which contain properties for id, orderCode, status, time, timeDelivery, amount, city, address, distance
 */
function parseOrderListHtml(html) {

    const orders = [];
    const $ = cheerio.load(html);
    $('tbody.narrow').filter((index, tbodyItem) => {

        const $tbodyItem = $(tbodyItem);
        const id = ($tbodyItem.attr('rel') || '').replace('#o', '').trim();
        const status = getStatusFromClassName($tbodyItem.attr('class'));
        // Formats a string to the ISO8601 standard.
        // It always returns a timestamp in UTC!
        //https://momentjs.com/docs/#/displaying/as-iso-string/
        const time = moment($('td.time', tbodyItem).text().trim(), 'HH:mm').toISOString();
        const timeDelivery = moment($('td.time-delivery', tbodyItem).text().trim() || time, 'HH:mm').toISOString();
        const orderCode = $('td.order-code', tbodyItem).text().trim();
        const city = $('td.city', tbodyItem).text().trim();
        // Amount in cents
        const amount = Number.parseInt($('td.amount', tbodyItem).text().substr(1).replace(/[,.\s]+/g, ''), 10);
        const address = $('td[colspan=2]', tbodyItem).text().trim();
        const distance = $('td.distance', tbodyItem).text().replace(',', '.').replace(/\s+/, '');

        orders.push({
            id,
            orderCode,
            status,
            time,
            timeDelivery,
            amount,
            city,
            address,
            distance
        });
    });

    return orders;
}


/**
 * Parse the given HTML and get the details of an order, like the type of delivery, way of payment, the name, phone number, products etc.
 *
 * @param {String} html Raw HTML of details page
 * @return {Object} Object with properties for details; delivery, paid, name, phoneNumber and products
 */
function parseOrderDetailsHtml(html) {

    const details = {};
    const $ = cheerio.load(html);

    // DELIVERY
    details.delivery = $('#order_details .summary .order-info-heading td').text();

    // Paid electronically / Customer pays in cash, exact
    details.paid = $('#order_details .content p:nth-child(2)').text();

    // Get text of first textNode. (and also get the HTML encoded characters right).
    details.name = $('#order_details .content > p').contents().eq(0).text();

    // Phone number is the last line of the name, address text.
    const addressHtml = $('#order_details .content > p').html();
    const addressHtmlSplitted = addressHtml.split(/<br ?\/?>/g);
    const phoneNumber = addressHtmlSplitted.pop();
    if (/[0-9 ()+-]{10,16}/.test(phoneNumber)) {
        // Test if it really is a phone number.
        details.phoneNumber = phoneNumber;
    }

    // Parse products.
    const products = [];
    const productRows = $('table.products tbody tr');
    productRows.each((index, item) => {
            const $row = $(item);
            const rowText = trimExcessiveWhitespace($row.text());
            if ($row.find('td').length === 2) {
                // Addition to the previous row.
                products.push(`${products.pop()} ${rowText}`);
            } else {
                products.push(rowText);
            }
        }
    );
    details.products = products;

    return details;
}


/**
 * Get details like payment type, name and phone number.
 *
 * @param {String} url URL to get the details from (HTTP POST)
 * @param {[]} orders List of orders
 * @param {Object} headersPost Headers to send with the post
 * @param {function} allDone Function will be called when all given orders are precessed
 * @param {boolean} verbose If true, log extra info to console
 */
function updateWithDetails(url, orders, headersPost, allDone, verbose) {

    const promises = [];
    orders.forEach(order => {

        promises.push(new Promise(resolve => {

            request.post({
                url,
                headers: headersPost,
                form: {
                    id: order.id
                }
            }, (error, response, html) => {

                // Error.
                if (error) {
                    console.error('Accessing url ' + urlDetails + ' to get details failed: ', error);

                    // We handled the order, that's why we use resolve().
                    resolve();
                    return;
                }

                if (verbose) {
                    console.log('details HTML: ', html);
                }

                // Parse HTML and update the order with the details.
                const details = parseOrderDetailsHtml(html);

                // Merge properties to the order.
                //https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically#171256
                Object.assign(order, details);

                resolve();
            });
        }));
    });

    Promise.all(promises)
        .then(() => allDone(orders));
}


/**
 * Trim excessive whitespace within the string and trim leading and trailing whitespace completely.
 *
 * @param {String} text String to trim
 * @return {String} Trimmed string or empty string in case the given parameter was not truthy
 */
function trimExcessiveWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}


/**
 * Determine order status based on list of class names.
 *
 * @param {String} className String with single class name or multiple class names
 * @return {String} Status 'Confirmed', 'Delivery', 'Kitchen' or an empty string
 */
function getStatusFromClassName(className) {
    return ucFirst((className || '').trim().split(/\s+/).find(item => item.indexOf('status-') !== -1).replace('status-', ''));
}


/**
 * Convert first character to upper case.
 *
 * @param {String} text
 * @return {String}
 */
function ucFirst(text) {
    const result = (text || '').trim();
    return result.substring(0, 1).toUpperCase() + result.substring(1).toLowerCase();
}


// Todo: convert times to time object.
// Todo: Convert amount to amount in cents
/*
let fields = {
    orderCode: order.orderCode,
    id: order.id,
    time: todayDate + ' ' + order.time + ':00',
    timeDelivery: todayDate + ' ' + order.timeDelivery + ':00',
    amount: order.amount.replace('.', ''),
    city: order.city,
    address: order.address,
    locationLatitude: order.locationLatitude,
    locationLongitude: order.locationLongitude,
    delivery: order.delivery,

    // Paid electronically
    // Customer pays with ? 30,00
    // Customer pays in cash, exact
    // Customer pays with ? 23,40
    paid: order.paid,
    name: order.name,
    phoneNumber: order.phoneNumber
};
*/

exports.getOrders = getOrders;
// For unit testing purposes.
exports._ucFirst = ucFirst;
exports._trimExcessiveWhitespace = trimExcessiveWhitespace;
exports._getStatusFromClassName = getStatusFromClassName;
exports._parseOrderListHtml = parseOrderListHtml;
exports._parseOrderDetailsHtml = parseOrderDetailsHtml;
