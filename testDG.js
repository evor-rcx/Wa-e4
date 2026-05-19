const axios = require('axios');

async function checkDuniaGames(id) {
    try {
        const payload = {
            productId: 3, 
            itemId: 85,
            catalogId: 182,
            paymentId: 1045,
            voucherPricePointId: 16104,
            userId: id,
            zoneId: ""
        };

        const res = await fetch("https://api.duniagames.co.id/api/transaction/v1/top-up/inquiry/store", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(data);
    } catch(e) {
        console.log(e.message);
    }
}
checkDuniaGames("6758652467");
