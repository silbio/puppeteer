const utils = require('./utils');
const stages = require("./stages");

module.exports = {
    async make(record, pageId) {



        utils.fetchCaptcha(pageId);
        let context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        page.on('console', (msg) => {
            let msgText = msg.text();
            if(msgText !== 'Failed to load resource: net::ERR_FAILED') {
                console.log('PAGE LOG:', msgText);
            }
        });
        page.on('dialog', async dialog => {
            let clickResult = await dialog.accept();
            console.log('Confirm box: ' + clickResult);
        });
        await page.setDefaultNavigationTimeout(process.env.NODE_ENV === 'development'?0:120000);
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
        await page.goto('https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus');


        new Promise(((resolve, reject) => {
            stages.init(page, record, resolve, reject, pageId)
        }))
            .then((results) => {
                console.log(results);
            }).catch((err) => {
            console.error(err)
        })
    }
}