const path = require('path');
const utils = require("../utils");

let processes = [];
let numberOfStages = 0;
let stageSuccessCriteria = [
    {},
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
        idTraits: {selector: 'input[id="txtDesCitado"]', contents: ''}
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
        idTraits: {selector: 'form[action^="acVerificarCita"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acVerificarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acVerificarCita'],
        idTraits: {selector: 'input[id="txtCodigoVerificacion"]', contents: ''}
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acGrabarCita', 'https://sede.administracionespublicas.gob.es/icpplustieb/acGrabarCita'],
        idTraits: {selector: 'span[id="justificanteFinal"]', contents: ''}
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
            let navigationResolution = results[1];
            logger.debug('Stage ' + stage + ' for pageId ' + pageId + ' finished with resolution: ' + processResolution.msg + '.');

            stage++;

            let pageUrl = navigationResolution._url.split(/[?;]/)[0];
            let successUrls = stageSuccessCriteria[stage].urls;
            let successUrlIsValid = successUrls.includes(pageUrl);
            logger.debug('stage:' + stage + '/' + (numberOfStages - 1), 'pageId: ' + pageId, 'pageUrl: ' + pageUrl, 'successUrls: ' + successUrls);

            //Check if page is correct by matching traits
            let matchesStageTraits = await utils.checkPageIdTraits(pageId, stageSuccessCriteria[stage].idTraits.selector, stageSuccessCriteria[stage].idTraits.contents);


            //Bump up stage if URL is valid success
            if (successUrlIsValid && matchesStageTraits) {

                pages[pageId].reloadCounter = 0;
                //On last loop succeed, if not iterate.
                if (stage === numberOfStages) {
                    pageMakerPromises[record.numeroDocumento].resolve({
                        msg: 'success',
                        strikingData: processResolution.strikingData
                    });
                    await pages[pageId].page.screenshot({path:'screenshots/success-'+ pageId + '.png'});
                    setTimeout(() => {
                        logger.debug('Closing page: ' + pageId)
                        pages[pageId].page.close();
                    }, 10000)
                } else {
                    iterate(pageId, record, stage);
                }
            } else {
                if (stage > 6) {
                    let timestamp = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
                    await pages[pageId].page.screenshot({path: 'screenshots/' + timestamp  + '_stage_' + stage + '_' + pageId + '.png'});
                }
            //    if(stage !== 7){
                    pageMakerPromises[record.numeroDocumento].reject({
                        message:
                            (!successUrlIsValid ? 'Resulting Url for stage ' + stage + ' is not one of ' + successUrls + '. It is ' + pageUrl + ' instead. /n' : '') +
                            (!matchesStageTraits ? 'Page traits for stage ' + stage + ' do not match success page configuration for session ' + pageId : ''),
                        reset: true
                    });
              //  }

            }


        }).catch((err) => {

        pageMakerPromises[record.numeroDocumento].reject(
            {
                message: `
                Error running stage ${stage} for pageId ${pageId}.
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