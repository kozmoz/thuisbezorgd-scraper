describe('thuisbezorgd-services', function () {

    const fs = require('fs');
    const path = require('path');
    const moment = require('moment');
    const service = require('./thuisbezorgd-services');


    beforeEach(function () {
    });


    it('should trim excessive whitespace within the text', function () {
        let text = service._trimExcessiveWhitespace('  test  123 876\n');
        expect(text).toBe('test 123 876');
    });


    it('should be able to parse the details of an order (1)', function () {

        let html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'details1.html'), 'utf-8');
        let details = service._parseOrderDetailsHtml(html);

        expect(details.delivery).toBe('Delivery');
        expect(details.paid).toBe('Paid electronically');
        expect(details.name).toBe('Hans Jansen');
        expect(details.phoneNumber).toBe('0612345678');
        expect(details.products.length).toBe(3);
        expect(details.products[0]).toBe('1 [Combi boxen] Combibox starter € 13,95');
        expect(details.products[1]).toBe('Delivery costs € 1,50');
        expect(details.products[2]).toBe('€ 15,45');
    });


    it('should be able to parse the details of an order (2)', function () {

        let html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'details2.html'), 'utf-8');
        let details = service._parseOrderDetailsHtml(html);

        expect(details.delivery).toBe('Pickup');
        expect(details.paid).toBe('Cash');
        expect(details.name).toBe('Jerwin');
        expect(details.phoneNumber).toBe('0614404445');
        expect(details.products.length).toBe(6);
        expect(details.products[0]).toBe('1 [Sashimi] Wakame 100 gr € 4,95');
        expect(details.products[1]).toBe('1 [Uramaki] Uramaki ebi tempura € 5,95 + 4 stuks');
        expect(details.products[2]).toBe('1 [Maki] Maki unagi € 8,30 + 8 stuks');
        expect(details.products[3]).toBe('1 [Poke bowl] Poké bowl gefrituurde gamba\'s en yakitori kipspiesjes € 8,95');
        expect(details.products[4]).toBe('Delivery costs € 1,50');
        expect(details.products[5]).toBe('€ 29,65');
    });


    it('should be able to parse the details of an order (3)', function () {

        let html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'details3.html'), 'utf-8');
        let details = service._parseOrderDetailsHtml(html);

        expect(details.delivery).toBe('Delivery');
        expect(details.paid).toBe('Paid electronically');
        expect(details.name).toBe('Ineke Grooters');
        expect(details.phoneNumber).toBe('0631291291');
        expect(details.products.length).toBe(4);
        expect(details.products[0]).toBe('1 [Combi boxen] Combibox rolls € 32,50 + 2 persoons');
        expect(details.products[1]).toBe('1 [Combi boxen] Combibox starter € 13,95');
        expect(details.products[2]).toBe('Delivery costs € 1,50');
        expect(details.products[3]).toBe('€ 47,95');
    });


    it('should be able to parse the list of orders (all confirmed)', function () {

        const html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'orders-confirmed.html'), 'utf-8');
        const orders = service._parseOrderListHtml(html);

        const momentTime = moment(moment({hour: 17, minute: 15}),'HH:mm').toISOString();
        const momentTimeDelivery = moment(moment({hour: 17, minute: 50}),'HH:mm').toISOString();

        expect(orders.length).toBe(3);
        expect(orders[0].id).toBe('OQ35ORNQOO');
        expect(orders[0].orderCode).toBe('AXEDON');
        expect(orders[0].status).toBe('Confirmed');
        expect(orders[0].time).toBe(momentTime);
        expect(orders[0].timeDelivery).toBe(momentTimeDelivery);
        expect(orders[0].amount).toBe(1545);
        expect(orders[0].city).toBe('Nijverdal');
        expect(orders[0].address).toBe('7443BS, Grotestraat 222');

        expect(orders[1].status).toBe('Confirmed');
        expect(orders[2].status).toBe('Confirmed');
    });


    it('should be able to parse the list of orders (confirmed and delivery)', function () {

        const html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'orders-delivery.html'), 'utf-8');
        const orders = service._parseOrderListHtml(html);

        const momentTime = moment(moment({hour: 18, minute: 18}),'HH:mm').toISOString();
        const momentTimeDelivery = moment(moment({hour: 18, minute: 50}),'HH:mm').toISOString();

        expect(orders.length).toBe(3);
        expect(orders[0].id).toBe('OO0PN0OQOO');
        expect(orders[0].orderCode).toBe('DFICYI');
        expect(orders[0].status).toBe('Confirmed');
        expect(orders[0].time).toBe(momentTime);
        expect(orders[0].timeDelivery).toBe(momentTimeDelivery);
        expect(orders[0].amount).toBe(2965);
        expect(orders[0].city).toBe('Nijverdal');
        expect(orders[0].address).toBe('7442AD, Croeselaan 2');

        expect(orders[1].status).toBe('Confirmed');
        expect(orders[2].status).toBe('Delivery');
    });


    it('should be able to parse the list of orders (confirmed and kitchen)', function () {

        let html = fs.readFileSync(path.join(__dirname, '..', 'spec', 'data', 'orders-kitchen.html'), 'utf-8');
        let orders = service._parseOrderListHtml(html);

        const momentTime = moment(moment({hour: 18, minute: 34}),'HH:mm').toISOString();
        const momentTimeDelivery = moment(moment({hour: 19, minute: 20}),'HH:mm').toISOString();

        expect(orders.length).toBe(3);
        expect(orders[0].id).toBe('OQP013OQOO');
        expect(orders[0].orderCode).toBe('ZL41AT');
        expect(orders[0].status).toBe('Kitchen');
        expect(orders[0].time).toBe(momentTime);
        expect(orders[0].timeDelivery).toBe(momentTimeDelivery);
        expect(orders[0].amount).toBe(4795);
        expect(orders[0].city).toBe('Nijverdal');
        expect(orders[0].address).toBe('7443PX, Croeselaan 5');
        expect(orders[0].distance).toBe('2.4km');

        expect(orders[1].status).toBe('Delivery');
        expect(orders[1].distance).toBe('0.1km');
        expect(orders[2].status).toBe('Delivery');
        expect(orders[2].distance).toBe('1.3km');
    });


    it('should get the status from the given list of class names', function () {
        let className = service._getStatusFromClassName('order-link narrow status-confirmed');
        expect(className).toBe('Confirmed');
    });


    it('should convert the first character of a text to upper case', function () {
        let className = service._ucFirst('confirmed');
        expect(className).toBe('Confirmed');
    });

});
