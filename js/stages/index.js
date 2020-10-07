const path = require('path');

let processes = [];
let numberOfStages = 0;
let successPages = [
    ['https://sede.administracionespublicas.gob.es/icpplus/index.html'],
    ['https://sede.administracionespublicas.gob.es/icpplustie/citar', 'https://sede.administracionespublicas.gob.es/icpplus/citar'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acInfo', 'https://sede.administracionespublicas.gob.es/icpplustieb/acInfo'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acEntrada', 'https://sede.administracionespublicas.gob.es/icpplustieb/acEntrada'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acValidarEntrada', 'https://sede.administracionespublicas.gob.es/icpplustieb/acValidarEntrada'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acCitar', 'https://sede.administracionespublicas.gob.es/icpplustieb/acCitar'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acVerFormulario', ' https://sede.administracionespublicas.gob.es/icpplustieb/acVerFormulario'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acOfertarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acOfertarCita'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acVerificarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acVerificarCita'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acGrabarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acGrabarCita']
]
// let errorPages = [
//     'https://sede.administracionespublicas.gob.es/icpplus/infogenerica'
// ]
let normalizedPath = path.join(__dirname, '.');
require("fs").readdirSync(normalizedPath).forEach(function (file) {

    if (file.indexOf('stage_') >= 0) {
        numberOfStages++;
        processes[file.split(/[_.]/)[1]] = require(path.join(normalizedPath, file));
    }
});
let pageMakerPromises = {}

function init(pageId, record, resolve, reject) {
    pages[pageId].lastPage = '';
    pages[pageId].reloadCounter = 0;
    iterate(pageId, record, 0);
    pageMakerPromises[record.numeroDocumento] = {resolve: resolve, reject: reject}

}


function iterate(pageId, record, stage) {
    logger.debug('Iterating stage ' + stage + ' of pageId ' + pageId)
    let navPromise = pages[pageId].page.waitForNavigation();
    let processPromise = new Promise((resolve, reject) => {
        processes[stage].run(pageId, record, resolve, reject);
    })
   // let pageMetrics = pages[pageId].page.metrics();

    Promise.all([processPromise, navPromise])
        .then((results) => {
            let stageReloaded = false;
            let processResolution = results[0];
            logger.debug('Stage ' + stage + ' for pageId ' + pageId + 'finished with resolution: ' + processResolution.msg + '.');

            let navigationResolution = results[1];


            let pageUrl = navigationResolution._url.split(/[?;]/)[0];
            let successUrl = successPages[stage];


            if (pageUrl === pages[pageId].page.lastPage) {
                stageReloaded = true;
                logger.debug('Stage ' + stage + ' was reloaded for pageId ' + pageId)
            }
            logger.debug('stage:' + stage + '/' + (numberOfStages - 1), 'pageUrl: ' + pageUrl, 'successUrl: ' + successUrl);
            if (successUrl.includes(pageUrl)) {
                if (!stageReloaded) {
                    stage++;
                }
                pages[pageId].lastPage = pageUrl;
                if (stage === numberOfStages) {
                    pageMakerPromises[record.numeroDocumento].resolve('success');
                    setTimeout(() => {
                        logger.debug('Closing page: ' + pageId)
                        pages[pageId].close();
                    }, 2000)
                } else {

                    iterate(pageId, record, stage);
                }
            } else {
                pageMakerPromises[record.numeroDocumento].reject({
                    message: 'Resulting Url for stage ' + stage + ' is not one of ' + successUrl + '. It is ' + pageUrl + ' instead.',
                    reset: false
                });
            }

        }).catch((err) => {

        pageMakerPromises[record.numeroDocumento].reject(
            {
                message: `
                Error running stage ${stage}.
                Error Message: 
                    ${err.message}`,
                stack: err.stack,
                reset: (!!(err.reset || err.name === 'TimeoutError'))

            }
        )
    })
}

module.exports = {init}