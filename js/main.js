const puppeteer = require('puppeteer-extra');
const pageMaker = require('./pageMaker');
const getData = require("./getData");
const {v4: uuidv4} = require('uuid');
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


let auth;



//Get Initial data
new Promise((resolve, reject) => {
    getData.init()
        .then((authToken) => {
            console.log('Data initialized correctly');
            auth = authToken;
            getData.populateDataMap(auth).then((data) => {
                console.log(JSON.stringify(data));
                resolve(data);
            })
        })
        .catch((err) => {
            // console.error(err);
            reject(err);
        });
}).then((data) => {


//open browser
    (async () => {
        global.browser = await puppeteer.launch({headless: false});
        global.userAgent = await browser.userAgent();
        let records = data.records;

        for (var i = 0; i < 1; i++) {
            let record = records[i];
            let pageId = await uuidv4();
            await makePages();

            async function makePages() {
                await pageMaker.make(record, pageId).then(async (resolution) => {
                    if (resolution === 'success') {
                        console.log(record.numeroDocumento + ' successfully finished')
                    } else if (resolution === 'reset') {
                        await makePages();
                    }
                }).catch(e => {
                    console.error(e)
                });
            }


        }


    })();
})
