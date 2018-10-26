// 'Request' package to handle the https communication.
// https://www.npmjs.com/package/request
// Execute http requests.
const request = require('request');
// path utility class
const path = require('path');
// Date manipulation library.
const moment = require('moment');

// Fast, flexible & lean implementation of core jQuery designed specifically for the server.
// https://github.com/cheeriojs/cheerio
/** @var {{load:Function}} cheerio */
const cheerio = require('cheerio');
// Read version info of thuisbezorgd-scraper.
const packageJson = require(path.join(__dirname, '..', 'package.json'));

// User agent is based on package name and version and includes the email address.
/** @namespace packageJson.name */
/** @namespace packageJson.version */
/** @namespace packageJson.email */
const USER_AGENT_STRING = `${packageJson.name}/${packageJson.version} (${packageJson.email})`;

// Thuisbezorgd.nl URLs.
const urlMain = 'https://orders.takeaway.com/';
const urlOrders = 'https://orders.takeaway.com/orders/orders';
const urlDetails = 'https://orders.takeaway.com/orders/details';

const debugPrefix = '\x1B[36mDEBUG\x1B[0m: ';

/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {Object} configuration Configuration object with the properties 'username', 'password', 'debug' (optional)
 *     and 'verbose' (optional)
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function getOrders(configuration) {

    // Show console logging output?
    const debug = configuration.debug;
    const verbose = configuration.verbose;

    return new Promise((resolveFn, rejectFn) => {

        const thuisbezorgdUsername = configuration.username;
        const thuisbezorgdPassword = configuration.password;

        if (!debug && (!thuisbezorgdUsername || !thuisbezorgdPassword)) {
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
                'status': 'Confirmed',
                'orderCode': 'ELMNZX',
                'time': '2017-11-11T16:13:00',
                'timeDelivery': '2017-11-11T16:45:00',
                'amount': 3945,
                'city': 'Nijverdal',
                'address': '7443ZM, Prins Hendrikstraat 19',
                'delivery': 'DELIVERY',
                'asap': false,
                'paid': 'Paid electronically',
                'name': 'Janneke',
                'phoneNumber': '0653830123',
                'distance': '3.2km',
                'products': [
                    '1 [Combi boxen] Combibox starter € 13,95',
                    '1 [Maki] Maki kappa € 2,10 + 4 stuks',
                    'Delivery costs € 1,50',
                    '€ 17,55'
                ]
            }, {
                'id': 'NPPP757711',
                'status': 'Delivery',
                'orderCode': 'ELMNZY',
                'time': '2017-11-11T18:50:00',
                'timeDelivery': '2017-11-11T19:30:00',
                'amount': 1000,
                'city': 'Nijverdal',
                'address': '7443BT, Grotestraat 222',
                'delivery': 'PICKUP',
                'asap': true,
                'paid': 'Customer pays in cash',
                'name': 'Piet',
                'phoneNumber': '0653830124',
                'distance': '0.5km',
                'products': [
                    '4 [Poke bowl] Poké bowl Ossenhaas € 35,80',
                    '2 [Combi boxen] Combibox rolls € 65,00 + 2 persoons',
                    '2 [Sashimi] Wakame 100 gr € 9,90',
                    '1 [Uramaki] Uramaki ebi tempura € 11,45 + 8 stuks',
                    'Delivery costs € 1,50',
                    '€ 123,65'
                ]
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

        // Add GET headers to POST headers object.
        Object.assign(headersPost, headersGet);

        // We enable cookies by default, so they're also used in subsequent requests.
        // https://github.com/request/request#readme
        const requestInstance = request.defaults({jar: true});

        // First GET to get the session cookie and secret request key.
        requestInstance.get({url: urlMain, headers: headersGet}, (error, response, html) => {

            if (verbose) {
                console.log(`${debugPrefix}First GET cookie response: ` + JSON.stringify(response.headers['set-cookie']));
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

            if (verbose) {
                console.log(`${debugPrefix}HTML headers of login POST: ` + JSON.stringify(headersPost));
            }

            // Login request
            requestInstance.post({
                url: urlMain,
                headers: headersPost,
                form: {
                    key,
                    login: true,
                    language: 'en',
                    username: thuisbezorgdUsername,
                    password: thuisbezorgdPassword
                }
            }, (error, response, html) => {

                if (verbose) {
                    console.log(`${debugPrefix}Login statusCode: ${response.statusCode}`);
                    console.log(`${debugPrefix}Login response html: ${html}`);
                }

                // Error.
                if (error) {
                    rejectFn('Accessing url ' + urlMain + ' to login failed: ' + JSON.stringify(error));
                    return;
                }

                // Test login html response for error message.
                // <p class="error">Enter your username and password. You can find these on your invoices.</p>
                const $ = cheerio.load(html);
                const errorMessage = $('p.error').text().trim();
                if (errorMessage) {
                    rejectFn(`Login failed with message: ${errorMessage}`);
                    return;
                }

                // The log-in was probably successful.

                // Start new request to get all orders.
                requestInstance.get({
                    url: urlOrders,
                    headers: headersPost
                }, (error, response, html) => {

                    if (verbose) {
                        console.log(`${debugPrefix}HTML GET: ${html}`);
                    }

                    const $ = cheerio.load(html);
                    const message = $('p.list').text();

                    // No orders, resolve with empty array.
                    if (message.indexOf('No orders yet') !== -1) {
                        if (verbose) {
                            console.log(`${debugPrefix}Found the "No orders yet" label, so we assume there are no orders`);
                        }
                        resolveFn([]);
                        return;
                    }

                    // Parse HTML for orders.
                    const orders = parseOrderListHtml(html);

                    // Always resolves
                    updateWithDetails(requestInstance, urlDetails, orders, headersPost, resolveFn, verbose);
                });
            });
        });
    });
}


/**
 * Parse the given HTML get the list of current orders.
 * An order contains an id, status, time, delivery time, order code, city, amount, address, distance, etc.
 *
 * @param {String} html Raw HTML of orders page
 * @return {[]} Array with objects which contain properties for id, orderCode, status, time, timeDelivery, amount,
 *     city, address, distance
 */
function parseOrderListHtml(html) {

    const orders = [];
    const $ = cheerio.load(html);
    $('tbody.narrow').filter((index, tbodyItem) => {

        const $tbodyItem = $(tbodyItem);
        const id = ($tbodyItem.attr('rel') || '').replace('#o', '').trim();
        const status = getStatusFromClassName($tbodyItem.attr('class'));
        // Formats a string to the ISO8601 standard without timezone info.
        // It always returns a timestamp in local time!
        let timeDelivery;
        const deliveryTimeAsString = $('td.time-delivery', tbodyItem).text().trim();
        const orderTimeAsMoment = moment($('td.time', tbodyItem).text().trim(), 'HH:mm');
        if (deliveryTimeAsString) {
            const deliveryDateAsMoment = moment(deliveryTimeAsString, 'HH:mm');
            timeDelivery = deliveryDateAsMoment.format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
        }
        const timeOrder = orderTimeAsMoment.format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
        const orderCode = $('td.order-code', tbodyItem).text().trim();
        const city = $('td.city', tbodyItem).text().trim();
        // Amount in cents
        const amount = Number.parseInt($('td.amount', tbodyItem).text().replace(/[^0-9]+/g, ''));
        const address = $('td[colspan=2]', tbodyItem).text().trim();
        const distance = $('td.distance', tbodyItem).text().replace(',', '.').replace(/\s+/, '');

        orders.push({
            id,
            orderCode,
            status,
            // Better to name it orderTime but for now keep it the old name to stay backwards compatible.
            time: timeOrder,
            // Can be undefined, field is not required.
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
 * Parse the given HTML and get the details of an order, like the type of delivery, way of payment, the name, phone
 * number, products etc.
 *
 * @param {String} html Raw HTML of details page
 * @return {Object} Object with properties for details; delivery, paid, name, phoneNumber and products
 */
function parseOrderDetailsHtml(html) {

    const details = {};
    const $ = cheerio.load(html);

    // Delivery details.
    const $orderDetails = $('#order_details');

    // PICKUP / DELIVERY
    details.delivery = ($orderDetails.find('.summary .order-info-heading td').text() || '').toUpperCase().trim();

    // Delivery at <strong>18:15</strong
    // Delivery a.s.a.p.
    const timeDelivery = $orderDetails.find('#delivery_time').text();
    details.asap = !!(timeDelivery && timeDelivery.indexOf('a.s.a.p') !== -1);

    // Paid electronically / Customer pays in cash, exact
    details.paid = $orderDetails.find('.content p:nth-child(2)').text();

    // Get text of first textNode. (and also get the HTML encoded characters right).
    details.name = $orderDetails.find('.content > p').contents().eq(0).text();

    // Phone number is the last line of the name, address text.
    // (.html() can return undefined, in that case default to empty string).
    const addressHtml = $orderDetails.find('.content > p').html() || '';
    const addressHtmlSplitted = addressHtml.split(/<br ?\/?>/g);
    const phoneNumber = addressHtmlSplitted.pop();
    if (phoneNumber && /[0-9 ()+-]{10,16}/.test(phoneNumber)) {
        // Test if it really looks like a phone number.
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
 * @param {Object} request which has cookies enabled
 * @param {String} url URL to get the details from (HTTP POST)
 * @param {[]} orders List of orders
 * @param {Object} headersPost Headers to send with the post
 * @param {function} allDone Function will be called when all given orders are precessed
 * @param {boolean} verbose If true, log extra info to console
 */
function updateWithDetails(request, url, orders, headersPost, allDone, verbose) {

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
                    console.log(`${debugPrefix}Accessing url ${urlDetails} to get details failed: ${error}`);

                    // We handled the order, that's why we use resolve().
                    resolve();
                    return;
                }

                if (verbose) {
                    console.log(`${debugPrefix}Details HTML: ${html}`);
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
 * @return {String} Status 'CONFIRMED', 'DELIVERY', 'KITCHEN' or an empty string
 */
function getStatusFromClassName(className) {
    return (className || '').trim()
        .split(/\s+/)
        .find(item => item.indexOf('status-') !== -1)
        .replace('status-', '')
        .toUpperCase();
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


// Public functions.
exports.getOrders = getOrders;
// For unit testing purposes.
exports._ucFirst = ucFirst;
exports._trimExcessiveWhitespace = trimExcessiveWhitespace;
exports._getStatusFromClassName = getStatusFromClassName;
exports._parseOrderListHtml = parseOrderListHtml;
exports._parseOrderDetailsHtml = parseOrderDetailsHtml;
