export interface IThuisbezorgdOrder {

    id: number;
    /**
     * e.g. 2B7RVE
     */
    public_reference: string;
    /**
     * Current status of the order.
     */
    status: "confirmed"|"kitchen"|"in_delivery"|"delivered";
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    placed_date: string;
    // Not sure about "pickup"
    delivery_type: "delivery"|"pickup";
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    requested_time: string,
    // Not sure about "cash"
    payment_type: "online"|"cash";
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    restaurant_estimated_delivery_time: string|null;
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    restaurant_estimated_pickup_time: string|null;
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    delivery_service_pickup_time: string;
    /**
     * Date as string, e.g. "2022-10-03T15:11:53Z"
     */
    delivery_service_delivery_time: string;
    currency: "EUR";
    remarks: string;
    /**
     * Total in Euro's. e.g. 31.45
     */
    subtotal: number;
    /**
     * Total in Euro's. e.g. 33.95
     */
    restaurant_total: number;
    /**
     * Total in Euro's. e.g. 33.95
     */
    customer_total: number;
    /**
     * Delivery costs in Euro's. e.g. 2.5
     */
    delivery_fee: number;
    discounts_total: number;
    // noinspection SpellCheckingInspection
    stampcards_total: number;
    customer: {
        full_name: string;
        street: string;
        street_number: string;
        phone_number: string;
        company_name: string|null;
        postcode: string;
        city: string;
        extra: [];
    };
    payment: {
        // Same as "payment_type" above? Not sure about cash.
        method: "online"|"cash";
        pays_with: number;
        already_paid_amount: number;
    };

    products: IThuisbezorgdProduct[];

    couriers: any[];
    food_preparation_duration: null;
    delivery_time_duration: null;
    is_ready_for_kitchen: boolean;
    /**
     * Date as string. e.g. "2022-10-03T15:12:23Z"
     */
    created_at: string;
    with_alcohol: boolean;
}

export interface IThuisbezorgdProduct {
    id: number;
    code: string;
    /**
     * e.g. "Poké bowl ossenhaas en kip"
     */
    name: string;
    /**
     * e.g. "Poke bowl"
     */
    category_name: string;
    quantity: number;
    amount: number;
    total_amount: number;
    remarks: string;
    specifications: [
        {
            id: number,
            code: string,
            /** e.g. "Normaal"  */
            name: string,
            amount: number
        }
    ]
}
