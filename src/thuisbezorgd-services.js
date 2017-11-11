// 'Request' package to handle the https communication.
// https://www.npmjs.com/package/request
// Execute http requests.
const request = require('request');
// Handle request cookies.
const Cookie = require('request-cookies').Cookie;

// Fast, flexible & lean implementation of core jQuery designed specifically for the server.
// https://github.com/cheeriojs/cheerio
const cheerio = require('cheerio');

// Morgan node module, for request logging.

const USER_AGENT_STRING = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36';

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
exports.getOrders = function (configuration) {

    // Show console logging output?
    let debug = configuration.debug;
    let verbose = configuration.verbose;

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
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': USER_AGENT_STRING,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'nl,en-US;q=0.8,en;q=0.6'
        };

        let headersPost = {
            'Host': 'orders.takeaway.com',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': USER_AGENT_STRING,
            'Cookie': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://orders.takeaway.com',
            'Referer': 'https://orders.takeaway.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            // 'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'nl,en-US;q=0.8,en;q=0.6'
        };

        // First GET to get the session cookie and secret request key.
        request.get({url: urlMain, headers: headersGet}, function (error, response, html) {

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
            let $ = cheerio.load(html);
            let key = $('input[name="key"]').val();

            // Get the session cookie.
            let rawCookies = response.headers['set-cookie'];
            let cookies = [];
            for (let prop in rawCookies) {
                if (!rawCookies.hasOwnProperty(prop)) {
                    continue;
                }
                let cookie = new Cookie(rawCookies[prop]);
                cookies.push(cookie.key + '=' + cookie.value);
            }

            // Update HTTP headers with sessions cookie.
            headersPost.Cookie = cookies.join(';');

            if (verbose) {
                console.log('HTML headers of login POST: ', JSON.stringify(headersPost));
            }

            let form = {
                key: key,
                login: true,
                language: 'en',
                username: thuisbezorgdUsername,
                password: thuisbezorgdPassword
            };

            // Login request
            request.post({url: urlMain, form: form, headers: headersPost}, function (error, response, html) {

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
                request.get({url: urlOrders, headers: headersPost}, function (error, response, html) {

                    if (verbose) {
                        console.log('HTML GET: ', html);
                    }

                    let $ = cheerio.load(html);
                    let message = $('p.list').text();

                    // No orders, resolve with empty array.
                    if (message.indexOf('No orders yet') !== -1) {
                        if (verbose) {
                            console.log('Found the "No orders yet" label, so we assume there are no orders');
                        }
                        resolveFn([]);
                        return;
                    }

                    // Parse HTML for orders.
                    let orders = parseOrderListHtml(html);

                    // Always resolves
                    updateWithDetails(orders, headersPost, resolveFn);
                });
            });
        });
    });
};

function parseOrderListHtml(html) {

    // Debugging.
    //html = fs.readFileSync('orders.html', 'utf-8');

    //console.log('HTML: ', html);
    let orders = [];
    const $ = cheerio.load(html);
    $('tbody.narrow').filter(function (index, tbodyItem) {

        const $tbodyItem = $(tbodyItem);
        let id = ($tbodyItem.attr('rel') || '').replace('#o', '').trim();
        let status = getStatusFromClassName($tbodyItem.attr('class'));
        let time = $('td.time', tbodyItem).text().trim();
        let timeDelivery = $('td.time-delivery', tbodyItem).text().trim() || time;
        let orderCode = $('td.order-code', tbodyItem).text().trim();
        let city = $('td.city', tbodyItem).text().trim();
        let amount = $('td.amount', tbodyItem).text().substr(1).replace(',', '.').replace(/\s+/,'');
        let address = $('td[colspan=2]', tbodyItem).text().trim();
        let distance = $('td.distance', tbodyItem).text().replace(',', '.').replace(/\s+/,'');

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
 * Parse html and get the details like type of delivery, way of payment, name, phone number and products.
 *
 * @param {String} html Raw HTML of details page
 * @return {Object} Object with properties for details; delivery, paid, name, phoneNumber and products
 */
function parseOrderDetailsHtml(html) {

    let details = {};
    let $ = cheerio.load(html);

    // DELIVERY
    details.delivery = $('#order_details .summary .order-info-heading td').text();

    // Paid electronically / Customer pays in cash, exact
    details.paid = $('#order_details .content p:nth-child(2)').text();

    // Get text of first textNode. (and also get the HTML encoded characters right).
    details.name = $('#order_details .content > p').contents().eq(0).text();

    // Phone number is the last line of the name, address text.
    let addressHtml = $('#order_details .content > p').html();
    let addressHtmlSplitted = addressHtml.split(/<br ?\/?>/g);
    let phoneNumber = addressHtmlSplitted.pop();
    if (/[0-9 ()+-]{10,16}/.test(phoneNumber)) {
        // Test if it really is a phone number.
        details.phoneNumber = phoneNumber;
    }

    // Parse products.
    let products = [];
    let productRows = $('table.products tbody tr');
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
 * todo: Fix details POST calls.
 *
 * @param {[]} orders List of orders
 * @param {Object} headersPost Headers to send with the post
 * @param {function} allDone Funtion the call when all orders are precessed
 * @return {Promise} Promise which resolves with the enriched orders
 */
function updateWithDetails(orders, headersPost, allDone) {

    let promises = [];
    for (let i = 0; i < orders.length; i++) {

        let order = orders[i];

        // Mutable variable should not be accessible from closure.
        // https://stackoverflow.com/questions/16724620/mutable-variable-is-accessible-from-closure-how-can-i-fix-this
        // Todo: Do not make functions within a loop/
        (function (tmpOrder) {
            promises.push(new Promise(function (resolve) {

                // Get details POST request.

                let form = {
                    id: tmpOrder.id
                };
                request.post({url: urlDetails, form: form, headers: headersPost}, function (error, response, html) {

                    // Error.
                    if (error) {
                        console.error('Accessing url ' + urlDetails + ' to get details failed: ', error);

                    } else {

                        if (true) {
                            console.log('details HTML: ', html);
                        }

                        // Parse HTML and update the order with the details.
                        let details = parseOrderDetailsHtml(html);
                        tmpOrder.delivery = details.delivery;
                        tmpOrder.paid = details.paid;
                        tmpOrder.name = details.name;
                        tmpOrder.phoneNumber = details.phoneNumber;
                    }

                    resolve();
                });
            }));
        }(order));
    }

    Promise.all(promises).then(() => allDone(orders));
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
    let result = (text || '').trim();
    return result.substring(0, 1).toUpperCase() + result.substring(1).toLowerCase();
}


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

// For unit testing purposes.
exports._ucFirst = ucFirst;
exports._trimExcessiveWhitespace = trimExcessiveWhitespace;
exports._getStatusFromClassName = getStatusFromClassName;
exports._parseOrderListHtml = parseOrderListHtml;
exports._parseOrderDetailsHtml = parseOrderDetailsHtml;
