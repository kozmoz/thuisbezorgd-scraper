# Changes to thuisbezorgd-scraper

### 2.4.0 - January 19, 2024

- Improvement: Code simplified and duplicates removed.

### 2.3.2 - January 8, 2024

- Improvement: Documentation

### 2.3.1 - January 8, 2024

- Improvement: Error detection function + unit tests

### 2.3.0 - July 5, 2023

- Improvement: Added function to set the order status to "confirmed", "kitchen", "in_delivery" or "delivered"

### 2.2.3 - February 6, 2023

- Improvement: In case of connection error SSLV3_ALERT_HANDSHAKE_FAILURE, return more specific error code "HTTP_ERROR_CONNECTION".

### 2.2.2 - February 1, 2023

- Improvement: In case of connection error ECONNRESET, return more specific error code "HTTP_ERROR_CONNECTION".

### 2.2.1 - January 22, 2023

- Improvement: In case of connection error, return more specific error code "HTTP_ERROR_CONNECTION".

### 2.2.0 - January 22, 2023

- Improvement: Added httpStatusCode to error-object in case the remote service fails with HTTP error.
- Improvement: Readme.md updated with v2 format of orders object. 

### 2.1.1 - (October 10, 2022)

- Bugfix: New https Agent for every call.

### 2.1.0 - (October 10, 2022)

- Improvement: Added "no-cache" headers.
- Improvement: Object types.
- Improvement: Return http(s) status in case of connection error.
- Bugfix: Don't rely on global node https Agent.
- Bugfix: Added spread operator to ESLint config.

### 2.0.2 - (October 9, 2022)

- Improvement: Added types in package.json.

### 2.0.1 - (October 9, 2022)

- Improvement: Removed unused npm dependencies.

### 2.0.0 - (October 8, 2022)

- Complete rewrite of service. Now using "live orders" webpage. Unfortunately the format is not backwards compatible.

### 1.3.3 - (July 21, 2019)

- Improvement: output will now also show customers notes (By R0B3RD)

### 1.3.2 (March 19, 2019)

- Improvement: Added extra error checking while loading the orders page

### 1.3.0 (December 1, 2018)

- Improvement/breaking change: Convert status to uppercase;
  New -> NEW, Confirmed -> CONFIRMED, Kitchen -> KITCHEN, Delivery -> DELIVERY
- Improvement: Trim comma and spaces from address

### 1.2.0 (October 24, 2018)

- Bugfix: Delivery type in capitals; DELIVERY / PICKUP
- Improvement: If the customer requested to receive the order a.s.a.p., "asap" is set to true, false otherwise

### 1.1.6 (October 17, 2018)

- Bugfix: In case of error, it shows [Object Object] on the command line, instead of the error message
- Improvement: The dates should be in local time, don't show it as UTC time
- Improvement: timeDelivery can be empty, in that case it is undefined
- Improvement: In case of debug, the username and password shouldn't be required

### 1.1.5 (September 30, 2018)

- Removed dependency on "request-cookies" package.
  Session cookies are now handled by the "request" package itself.
  This fixes issue #1 (critical vulnerability in request-cookies npm package).

### 1.1.4 (April 28, 2018)

- Bugfix: Phone number appears to be optional, test if it's available before extracting from HTML

### 1.1.3 (November 12, 2017)

- Updated moment.js library to 2.19.2
- Use console.log() for debug logging instead of cli.debug()

### 1.1.2 (November 12, 2017)

- Added extra check to test if login was successful

### 1.1.1 (November 12, 2017)

- Added cli toolkit for command line parsing.
- Code cleanup

### 1.1.0 (November 11, 2017)

- Return dates as ISO8601 string in the UTC time zone.
- Return amount as integer in cents instead of string with floating point decimals.

### 1.0.0 (August 25, 2017)

- Initial version.
