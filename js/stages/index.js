const path = require('path');
const utils = require("../utils");

let processes = [];
let numberOfStages = 0;
let stageSuccessCriteria = [
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/index.html'],
        idTraits: {selector: 'select[id="form"]', contents: 'barcelona'}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplustie/citar', 'https://sede.administracionespublicas.gob.es/icpplus/citar'],
        idTraits: {selector: 'select[id="tramiteGrupo[0]"]', contents: 'despliegue'}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acInfo', 'https://sede.administracionespublicas.gob.es/icpplustieb/acInfo'],
        idTraits: {selector: 'form[action^="acEntrada"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acEntrada', 'https://sede.administracionespublicas.gob.es/icpplustieb/acEntrada'],
        idTraits: {selector: 'select[id="txtPaisNac"]', contents: 'apatrida'}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acValidarEntrada', 'https://sede.administracionespublicas.gob.es/icpplustieb/acValidarEntrada'],
        idTraits: {selector: 'input[id="btnConsultar"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acCitar', 'https://sede.administracionespublicas.gob.es/icpplustieb/acCitar'],
        idTraits: {selector: 'select[id="idSede"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acVerFormulario', 'https://sede.administracionespublicas.gob.es/icpplustieb/acVerFormulario'],
        idTraits: {selector: 'input[id="txtTelefonoCitado"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acOfertarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acOfertarCita'],
        idTraits: {selector: 'label[for="txtTelefonoCitado"]', contents: 'telefono'}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acVerificarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acVerificarCita'],
        idTraits: {selector: 'form[action^="acVerificarCita"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acGrabarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acGrabarCita'],
        idTraits: {selector: 'input[id="txtCodigoVerificacion"]', contents: ''}
    }
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
        .then(async (results) => {
            //Get resolutions
            let processResolution = results[0];
            logger.debug('Stage ' + stage + ' for pageId ' + pageId + ' finished with resolution: ' + processResolution.msg + '.');

            let stageReloaded = false;
            let navigationResolution = results[1];
            let pageUrl = navigationResolution._url.split(/[?;]/)[0];
            let successUrls = stageSuccessCriteria[stage].urls;
            let successUrlIsValid = successUrls.includes(pageUrl);
            logger.debug('stage:' + stage + '/' + (numberOfStages - 1), 'pageId: ' + pageId, 'pageUrl: ' + pageUrl, 'successUrls: ' + successUrls);

            //If URL is the same or if id object is the same, it's a reloaded stage

            //Check against the previous stage traits
            let matchPreviousStageTraits = stage === 0 ? false : await utils.checkPageIdTraits(pageId, stageSuccessCriteria[(stage-1)].idTraits.selector, stageSuccessCriteria[(stage-1)].idTraits.contents);
            if (pageUrl === pages[pageId].lastPage || matchPreviousStageTraits) {
                stageReloaded = true;
                pages[pageId].reloadCounter++;
                logger.debug('Stage ' + stage + ' was reloaded for pageId ' + pageId+'. Previous page traits matched: ' + matchPreviousStageTraits);
                if (pages[pageId].reloadCounter === 10) {
                    pages[pageId].reloadCounter = 0;
                    pageMakerPromises[record.numeroDocumento].reject({
                        message: 'Reloads exhausted on stage' + stage + 'for pageId' + pageId + ', restarting process!',
                        reset: true
                    });
                }
            }
            pages[pageId].lastPage = pageUrl;

            //~Bump up stage if URL is valid success
            if (successUrlIsValid && !stageReloaded) {
                stage++;
                pages[pageId].reloadCounter = 0;
            }
            //On last loop succeed, if not iterate.
            if (stage === numberOfStages) {
                pageMakerPromises[record.numeroDocumento].resolve({msg: 'success', strikingData: processResolution.strikingData});
                setTimeout(() => {
                    logger.debug('Closing page: ' + pageId)
                    //pages[pageId].page.close();
                }, 10000)
            } else {
                iterate(pageId, record, stage);
            }

            // If the URL isn't valid and the page wasn't reloaded, reject.
            if (!successUrlIsValid && !stageReloaded) {
                pageMakerPromises[record.numeroDocumento].reject({
                    message: 'Resulting Url for stage ' + stage + ' is not one of ' + successUrls + '. It is ' + pageUrl + ' instead.',
                    reset: true
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
                reset: (!!(err.reset || err.name === 'TimeoutError')),
                name: err.name

            }
        )
    })
}

module.exports = {init}