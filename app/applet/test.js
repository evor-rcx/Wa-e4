const id = '1234567';

const testApis = async () => {
    try {
        const idParam = '6758652467';  // example FF ID
        const targetUrl = `https://api.ryzendesu.vip/api/game/freefire?id=${idParam}`;
        const url = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("ryzendesu via allorigins:", JSON.parse(data.contents));
    } catch(e) {
        console.error("ryzendesu failed", e.message);
    }

    try {
        const idParam = '6758652467';  
        const targetUrl = `https://api.isan.my.id/api/ff/check?id=${idParam}`;
        const url = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("isan via allorigins:", JSON.parse(data.contents));
    } catch(e) {
        console.error("isan failed", e.message);
    }
}
testApis();
