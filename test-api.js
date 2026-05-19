const id = '1234567';

const testApis = async () => {
    try {
        let res = await fetch("https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("https://api.ryzendesu.vip/api/game/freefire?id=6758652467"));
        console.log("ryzendesu codetabs:", await res.text());
    } catch(e) { console.error("failed", e.message); }
}
testApis();
