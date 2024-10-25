
require('dotenv').config();
const { KolHalashonAPI, QualityLevel } = require('./api');

const api = new KolHalashonAPI();

// If you want to use a specific username and password, you can pass them to the constructor
// const api = new KolHalashonAPI(process.env.KOL_HALASHON_USERNAME, process.env.KOL_HALASHON_PASSWORD, true);

async function main() {
    try {
        const searchKeyword = "כהן";
        const searchResults = await api.searchItems(searchKeyword);
        console.log(searchResults);

        // Get shiurim for a specific rav
        const ravId = 138;
        const shiurim = await api.searchRavShiurim(ravId);
        console.log(shiurim);
        shiurim.forEach(shiur => {
            console.log(`כותרת: ${shiur.title}, רב: ${shiur.rav}, ID: ${shiur.FileId}`);
        });

        // Get shiur details
        const fileId = 38992322;
        const shiurDetails = await api.getShiurDetails(fileId);
        console.log('Shiur details:', shiurDetails);

        // Download file
        await api.downloadFile(fileId, QualityLevel.AUDIO);
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

main();
