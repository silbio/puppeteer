const utils = require('./utils');
const stages = require("./stages");

module.exports = {
    async make(pageId, record, mainResolve, mainReject) {

        utils.fetchCaptcha(pageId);

        pages[pageId].page.on('console', (msg) => {
            let msgText = msg.text();
            if (msgText !== 'Failed to load resource: net::ERR_FAILED') {
                logger.debug('Log from page', pageId, msgText);
            }
        });
        pages[pageId].page.on('dialog', async dialog => {
            let clickResult = await dialog.accept();
            logger.debug('Confirm box: ' + clickResult);
        });
        await pages[pageId].page.setDefaultNavigationTimeout(process.env.NODE_ENV === 'development' ? 60000 : 180000);
        await pages[pageId].page.setRequestInterception(true);
        pages[pageId].page.on('request', (request) => {
            if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
        await pages[pageId].page.goto('https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus');


        new Promise(((stagesResolve, stagesReject) => {
            stages.init(pageId, record, stagesResolve, stagesReject)
        }))
            .then((results) => {
                mainResolve(results);
            }).catch((err) => {
            pages[pageId].page.close();
            mainReject(err);
        })
    }
}