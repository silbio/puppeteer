const utils = require('./utils');
const stages = require("./stages");

module.exports = {
    async make(record, page, pageId, mainResolve, mainReject) {

        //utils.fetchCaptcha(pageId);

        page.on('console', (msg) => {
            let msgText = msg.text();
            if (msgText !== 'Failed to load resource: net::ERR_FAILED') {
                logger.debug('PAGE LOG:', msgText);
            }
        });
        page.on('dialog', async dialog => {
            let clickResult = await dialog.accept();
            logger.debug('Confirm box: ' + clickResult);
        });
        await page.setDefaultNavigationTimeout(process.env.NODE_ENV === 'development' ? 0 : 60000);
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
        await page.goto('https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus');


        new Promise(((stagesResolve, stagesReject) => {
            stages.init(page, record, stagesResolve, stagesReject, pageId)
        }))
            .then((results) => {
                mainResolve(results);
            }).catch((err) => {
                page.close();
            mainReject(err);
        })
    }
}