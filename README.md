
Thuisbezorgd-scraper
====================

![npm package version](https://img.shields.io/npm/v/thuisbezorgd-scraper.svg)

About
-----
Thuisbezorgd-scraper scrapes the Thuisbezorgd.nl / Takeaway.com restaurant website to get all current orders. 
The resulting list of orders is returned in JSON format. 

Intended for restaurant owners.

Developed in collaboration with Sushi 81. Delivery and take-away restaurant of sushi and Poke Bowls. Located in Nijverdal, the Netherlands. 
https://sushi81.nl   

Install
-------
You can either install it as local dependency to a project, or install it globally to be able to use it on the command line.

To install <code>thuisbezorgd-scraper</code> globally, on the command line type the following:

    $ npm install -g thuisbezorgd-scraper
        
Once installed globally, you can run it from any location:

    $ thuisbezorgd-scraper --help
        

Usage Command Line
------------------
To list all current orders for example, execute <code>thuisbezorgd-scraper</code> with respectively the 
<code>--username</code> and <code>--password</code> option. Optionally add the <code>--verbose</code> 
flag to see extra logging during execution.

    $ thuisbezorgd-scraper --username <username> --password <password> [--verbose]

For example, the output of the command above could look like this:

	{
		"orders": [
			{
				"id": "O3NQN1105O",
				"orderCode": "E0NQVH",
				"status": "CONFIRMED",
				"time": "2017-11-11T18:55:00",
				"timeDelivery": "2017-11-11T19:55:00",
				"amount": 1755,
				"city": "Nijverdal",
				"address": "7443LC, Dille 99",
				"distance": "3.2km",
				"delivery": "DELIVERY",
				"paid": "Paid electronically",
				"name": "Jan Jansen",
				"notes": "",
				"phoneNumber": "0548 612345",
				"products": [
					"1 [Combi boxen] Combibox starter € 13,95",
					"1 [Maki] Maki kappa € 2,10 + 4 stuks",
					"Delivery costs € 1,50",
					"€ 17,55"
				]
			},
			{
				"id": "ON3NRNPROO",
				"orderCode": "1T4UPU",
				"status": "DELIVERY",
				"time": "2017-11-11T14:16:00",
				"timeDelivery": "2017-11-11T15:45:00",
				"amount": 12365,
				"city": "Nijverdal",
				"address": "7443BT, Grotestraat 222",
				"distance": "3.2km",
				"delivery": "DELIVERY",
				"paid": "Paid electronically",
				"name": "Jan van Veen",
				"notes": "",
				"phoneNumber": "0612345678",
				"products": [
					"4 [Poke bowl] Poké bowl Ossenhaas € 35,80",
					"2 [Combi boxen] Combibox rolls € 65,00 + 2 persoons",
					"2 [Sashimi] Wakame 100 gr € 9,90",
					"1 [Uramaki] Uramaki ebi tempura € 11,45 + 8 stuks",
					"Delivery costs € 1,50",
					"€ 123,65"
				]
			}
		]
	}

Usage in Code
-------------
We assume that npm is installed and that the project already contains a package.json file. 
If not, then first initialize the project.

    $ npm init
      
Install <code>thuisbezorgd-scraper</code> as node module and save it to package.json:

    $ npm install thuisbezorgd-scraper --save

Add <code>thuisbezorgd-scraper</code> to your program with <code>require</code> 
and call <code>scrape()</code> with the username and password encapsulated within a 
configuration object:  

    const thuisbezorgdScraper = require('thuisbezorgd-scraper');
    const options = {
        username: 'username',
        password: 'password',
        verbose: false
    }
    thuisbezorgdScraper.scrape(options)
        .then(orders => {
            // Pretty print orders to console.
            console.log(JSON.stringify({orders: orders}, null, 4));
        })
        .catch(error => {
            console.log('ERROR: Failed to load the orders:');
            console.log(error);
        });

Development
===========

Unit tests
----------
To start the unit tests:

    $ npm run test
    
Debugging
---------
To show example output, start it with the <code>--debug</code> flag.

    $ thuisbezorgd-scraper --debug     
      
Code style 
----------
JavaScript project code style: 

https://github.com/standard/standard

Request npm package
-------------------
https://github.com/request/request#readme
