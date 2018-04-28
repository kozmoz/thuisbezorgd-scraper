# Changes to thuisbezorgd-scraper

### Todo 
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
