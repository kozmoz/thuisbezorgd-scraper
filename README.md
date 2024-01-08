
Introduction
============

As of October 2022, Thuisbezorgd.nl / Takeaway.com has introduced a revitalized web application, 
alongside the iOS and Android apps. These are designed to display live orders with enhanced efficiency.

Previously, the service relied heavily on HTML scraping, but I have entirely rewritten the service from the ground up. 
Now, it taps directly into the Thuisbezorgd.nl web application's underlying API calls, significantly improving the 
data fetching process.

Though we've transitioned away from HTML scraping, the service retains its original name for historical continuity.

However, it's important to note that due to significant changes in retrieving and presenting data, 
**the format is not backward compatible**. This shift to enhance efficiency and user experience has also led us to 
update our version numbering to reflect these considerable improvements.


Thuisbezorgd-scraper
====================

![npm package version](https://img.shields.io/npm/v/thuisbezorgd-scraper.svg)

Real-Time Order Fetching
------------------------
Thuisbezorgd-scraper scrapes the Thuisbezorgd.nl / Takeaway.com restaurant website to get all current orders. 
The resulting list of orders is returned in JSON format. 

Intended for restaurant owners.

Developed in collaboration with Sushi 81. Delivery and take-away restaurant of sushi and Poke Bowls. Located in Nijverdal, the Netherlands. 
https://sushi81.nl   

Thuisbezorgd-scraper is a specialized software service designed to interact with the Thuisbezorgd.nl / 
Takeaway.com online food ordering platform. Utilizing advanced web scraping techniques, it fetches the latest, 
live order data from the restaurant website, outputting the result as a structured JSON file.

This tool holds significant potential for restaurant owners, enabling real-time tracking of current orders 
to streamline and enhance their service.

Proudly co-developed with Sushi 81, a renowned delivery and takeaway restaurant specializing in sushi and Poke bowls, 
based in Nijverdal, the Netherlands. More about their delightful dishes at [Sushi 81 Website](https://sushi81.nl)


Installation Guide
------------------
There are two ways you can install and use `thuisbezorgd-scraper`: as a local dependency within a specific project 
or as a global dependency to be accessible from anywhere on your system via the command line.

To install `thuisbezorgd-scraper` as a global module, use the following command:

    $ npm install -g thuisbezorgd-scraper

After global installation, you can verify the installation and get a brief overview of available operations by 
running the help command:

    $ thuisbezorgd-scraper --help


Usage Command Line
------------------
To list all current orders for example, execute <code>thuisbezorgd-scraper</code> with respectively the 
<code>--username</code> and <code>--password</code> option. Optionally add the <code>--verbose</code> 
flag to see extra logging during execution.

    $ thuisbezorgd-scraper --username <username> --password <password> [--verbose]

For example, the output of the command above could look like this:

	{
		"orders": [ {
            "id": 5995485231,
            "public_reference": "2B7RVE",
            "status": "delivered",
            "placed_date": "2022-10-03T15:11:53Z",
            "delivery_type": "delivery",
            "requested_time": "2022-10-03T16:00:00Z",
            "payment_type": "online",
            "restaurant_estimated_delivery_time": "2022-10-03T16:00:00Z",
            "restaurant_estimated_pickup_time": null,
            "delivery_service_pickup_time": "2022-10-03T15:58:14Z",
            "delivery_service_delivery_time": "2022-10-03T16:44:34Z",
            "currency": "EUR",
            "remarks": "",
            "subtotal": 31.45,
            "restaurant_total": 33.95,
            "customer_total": 33.95,
            "delivery_fee": 2.5,
            "discounts_total": 0,
            "stampcards_total": 0,
            "customer": {
                "full_name": "M",
                "street": "De Bloeven",
                "street_number": "33",
                "phone_number": "0612345678",
                "company_name": null,
                "postcode": "7447BS",
                "city": "Hellendoorn",
                "extra": []
            },
            "payment": {
                "method": "online",
                "pays_with": 0,
                "already_paid_amount": 33.95
            },
            "products": [ {
                "id": 16585766451,
                "code": "",
                "name": "Pok\u00e9 bowl ossenhaas en kip",
                "category_name": "Poke bowl",
                "quantity": 1,
                "amount": 13.45,
                "total_amount": 13.45,
                "remarks": "",
                "specifications": [ {
                   "id": 15075185001,
                    "code": "",
                    "name": "Normaal",
                    "amount": 0
                } ] },
                {
                "id": 16585766551,
                "code": "",
                "name": "Uramaki kip en avocado",
                "category_name": "Uramaki",
                "quantity": 1,
                "amount": 6.15,
                "total_amount": 6.15,
                "remarks": "",
                "specifications": [ {
                    "id": 15075185011,
                    "code": "",
                    "name": "4 stuks",
                    "amount": 0
                } ]
                } ],
            "couriers": [],
            "food_preparation_duration": null,
            "delivery_time_duration": null,
            "is_ready_for_kitchen": false,
            "created_at": "2022-10-03T15:12:23Z",
            "with_alcohol": false
            },
            {
            "id": 5996543601,
            "public_reference": "5JRJAM",
            "status": "delivered",
            "placed_date": "2022-10-03T15:52:30Z",
            "delivery_type": "delivery",
            "requested_time": null,
            "payment_type": "online",
            "restaurant_estimated_delivery_time": "2022-10-03T16:24:00Z",
            "restaurant_estimated_pickup_time": null,
            "delivery_service_pickup_time": "2022-10-03T16:16:41Z",
            "delivery_service_delivery_time": "2022-10-03T16:44:43Z",
            "currency": "EUR",
            "remarks": "",
            "subtotal": 21.8,
            "restaurant_total": 24.3,
            "customer_total": 24.3,
            "delivery_fee": 2.5,
            "discounts_total": 0,
            "stampcards_total": 0,
            "customer": {
                "full_name": "Arian Jansen",
                "street": "Klaver",
                "street_number": "4",
                "phone_number": "0612345678",
                "company_name": null,
                "postcode": "7443TM",
                "city": "Nijverdal",
                "extra": []
            },
            "payment": {
                "method": "online",
                "pays_with": 0,
                "already_paid_amount": 24.3
            },
            "products": [ {
                "id": 16588965931,
                "code": "",
                "name": "Pok\u00e9 bowl tonijn en zalm",
                "category_name": "Poke bowl",
                "quantity": 1,
                "amount": 13.6,
                "total_amount": 13.6,
                "remarks": "",
                "specifications": [ {
                    "id": 15077904391,
                    "code": "",
                    "name": "Normaal",
                    "amount": 0
                } ]
            } ],
            "couriers": [],
            "food_preparation_duration": null,
            "delivery_time_duration": null,
            "is_ready_for_kitchen": false,
            "created_at": "2022-10-03T15:52:34Z",
            "with_alcohol": false
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
