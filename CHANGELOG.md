# Changes to thuisbezorgd-scraper

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
