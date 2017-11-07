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

        // Return demo data.
        if (configuration.debug) {
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

            // console.log('response: ' + JSON.stringify(response.headers['set-cookie']));
            // process.exit(0);
            // return;


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

            if (debug) {
                console.log('HTML headers: ', JSON.stringify(headersPost));
            }

            let form = {
                key: key,
                login: true,
                language: 'en',
                username: thuisbezorgdUsername,
                password: thuisbezorgdPassword
            };

            // Login request
            request.post({url: urlMain, form: form, headers: headersPost}, function (error) {

                // Error.
                if (error) {
                    rejectFn('Accessing url ' + urlMain + ' to login failed: ' + JSON.stringify(error));
                    return;
                }

                // The log-in was probably successful.

                // Start new request to get all orders.
                request.get({url: urlOrders, headers: headersPost}, function (error, response, html) {

                    if (debug) {
                        console.log('HTML GET: ', html);
                    }

                    let $ = cheerio.load(html);
                    let message = $('p.list').text();

                    // No orders, resolve with empty array.
                    if (message.indexOf('No orders yet') !== -1) {
                        if (debug) {
                            console.log('No orders yet');
                        }
                        resolveFn([]);
                        return;
                    }

                    // Parse HTML for orders.
                    let orders = parseOrdersHtml(html);

                    // Always resolves
                    updateWithDetails(orders, headersPost, resolveFn);
                });
            });
        });
    });
};

function parseOrdersHtml(html) {

    // Debugging.
    //html = fs.readFileSync('orders.html', 'utf-8');

    //console.log('HTML: ', html);
    let orders = [];
    let $ = cheerio.load(html);
    $('tbody.status-delivery.narrow').filter(function (index, item) {

        let rel = ($(item).attr('rel') || '').replace('#o', '');
        let time = $('td.time', item).text();
        let timeDelivery = $('td.time-delivery', item).text().trim();
        let orderCode = $('td.order-code', item).text();
        let city = $('td.city', item).text();
        let amount = $('td.amount', item).text().substr(1).replace(',', '.').trim();
        let address = $('td[colspan=2]', item).text().trim();

        orders.push({
            id: rel,
            orderCode: orderCode,
            time: time,
            timeDelivery: timeDelivery || time,
            amount: amount,
            city: city,
            address: address
        });
    });

    return orders;
}


function parseDetailsHtml(html) {

    // Debugging.
    //html = fs.readFileSync('sample-html/details.html', 'utf-8');
    //console.log('HTML: ', html);

    let details = {};
    let $ = cheerio.load(html);

    // DELIVERY
    details.delivery = ($('#order_details .summary .order-info-heading td').text() || '').toUpperCase();

    // Paid electronically / Customer pays in cash, exact
    details.paid = $('#order_details .content p:nth-child(2)').text();

    let addressHtml = $('#order_details .content > p').html();
    // details.name = decodeHtml(addressHtml.split('<br>')[0]);
    // Get text of first textNode. (and also get the HTML encoded characters right).
    details.name = $('#order_details .content > p').contents().eq(0).text();

    // Phone number is the last line of the name, address text.
    let addressHtmlSplitted = addressHtml.split('<br>');
    let phoneNumber = addressHtmlSplitted.pop();
    if (/[0-9 ()+-]{10,16}/.test(phoneNumber)) {
        // Test if it really is phone number.
        details.phoneNumber = phoneNumber;
    }

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
                        // Parse HTML and update the order with the details.
                        let details = parseDetailsHtml(html);
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

