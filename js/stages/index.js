const path = require('path');
const utils = require("../utils");

let processes = [];
let numberOfStages = 0;
let stageSuccessCriteria = [
    {
        urls: ['https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus'],
        idTraits: {selector: 'input[id="submit"]', contents: ''},
        stage: 0
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/index.html'],
        idTraits: {selector: 'select[id="form"]', contents: 'barcelona'},
        stage: 1
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplustie/citar',
            'https://sede.administracionespublicas.gob.es/icpplus/citar',
            'https://sede.administracionespublicas.gob.es/icpco/citar',
            'https://sede.administracionespublicas.gob.es/icpplustiem/citar'],
        idTraits: {selector: 'select[id="tramiteGrupo[0]"]', contents: 'despliegue'},
        stage: 2
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acInfo',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acInfo',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acInfo',
            'https://sede.administracionespublicas.gob.es/icpco/acInfo',
            'https://sede.administracionespublicas.gob.es/icpplustie/acInfo'],
        idTraits: {selector: 'form[action^="acEntrada"]', contents: ''},
        stage: 3
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acEntrada',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acEntrada',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acEntrada',
            'https://sede.administracionespublicas.gob.es/icpco/acEntrada'
        ],
        idTraits: {selector: 'input[id="txtDesCitado"]', contents: ''},
        stage: 4
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acValidarEntrada',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acValidarEntrada'],
        idTraits: {selector: 'input[id="btnConsultar"]', contents: ''},
        stage: 5
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acCitar',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acCitar',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acCitar',
            'https://sede.administracionespublicas.gob.es/icpco/acCitar'
        ],
        idTraits: {selector: 'select[id="idSede"]', contents: ''},
        stage: 6
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acVerFormulario',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acVerFormulario'],
        idTraits: {selector: 'input[id="txtTelefonoCitado"]', contents: ''},
        stage: 7
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acOfertarCita',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acOfertarCita',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acOfertarCita',
            'https://sede.administracionespublicas.gob.es/icpco/acOfertarCita'
        ],
        idTraits: {selector: 'form[action^="acVerificarCita"]', contents: ''},
        stage: 8
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acVerificarCita',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acVerificarCita',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acVerificarCita',
            'https://sede.administracionespublicas.gob.es/icpco/acVerificarCita',
        ],
        idTraits: {selector: 'input[id="txtCodigoVerificacion"]', contents: ''},
        stage: 9
    },
    {
        urls: ['https://sede.administracionespublicas.gob.es/icpplus/acGrabarCita',
            'https://sede.administracionespublicas.gob.es/icpplustieb/acGrabarCita',
            'https://sede.administracionespublicas.gob.es/icpplustiem/acGrabarCita',
            'https://sede.administracionespublicas.gob.es/icpco/acGrabarCita',
        ],
        idTraits: {selector: 'span[id="justificanteFinal"]', contents: ''},
        stage: 10
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
    if(!global.appStarted){
        return false;
    }
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

            if (stage > 6) {
                await pages[pageId].page.screenshot({path: 'logs/screenshots/' + utils.getTimeStampInLocaLIso() + '_stage_' + stage + '_' + pageId + '.png'});
            }

            let pageUrl = navigationResolution._url.split(/[?;]/)[0];
            let successUrls = stageSuccessCriteria[stage].urls;
            let successUrlIsValid = successUrls.includes(pageUrl);
            logger.debug('stage:' + stage + '/' + (numberOfStages - 1), 'pageId: ' + pageId, 'pageUrl: ' + pageUrl, 'successUrls: ' + successUrls);

            //Check if page is correct by matching traits
            let matchesStageTraits = await utils.checkPageIdTraits(pageId, stageSuccessCriteria[stage].idTraits.selector, stageSuccessCriteria[stage].idTraits.contents);

//Check for exceptions

            if((successUrlIsValid && !matchesStageTraits && stage === 5)){
                utils.removeSolvedCaptcha(pageId);
                utils.reportIncorrectRecaptcha(pages[pageId].taskId);
                logger.warn('Incorrect Captcha Provided to ' + pageId + ' from task ' + pages[pageId].taskId);
                utils.fetchCaptcha(pageId).then(()=>{
                    stage--;
                    iterate(pageId, record, stage);
                }).catch((err)=>{pageMakerPromises[record.numeroDocumento].reject(err)});
            }
            //Bump up stage if URL is valid success
           else if (successUrlIsValid && matchesStageTraits) {

                pages[pageId].reloadCounter = 0;
                //On last loop succeed, if not iterate.
                if (stage === numberOfStages) {
                    pageMakerPromises[record.numeroDocumento].resolve({
                        msg: 'success',
                        strikingData: processResolution.strikingData
                    });
                    await pages[pageId].page.screenshot({path: 'logs/screenshots/success-' + pageId + '.png'});
                    logger.info('HAR File recorded for pageId: ' + pageId);
                    await pages[pageId].har.stop();
                    setTimeout(() => {
                        logger.debug('Closing page: ' + pageId);
                        pages[pageId].page.close();
                    }, 5000)
                } else {
                    iterate(pageId, record, stage);
                }
            } else {
                logger.debug('Closing page: ' + pageId);
                if (stage > 7) {
                    logger.info('HAR File recorded for pageId: ' + pageId);
                    await pages[pageId].har.stop();
                }
                await pages[pageId].page.close();
                pageMakerPromises[record.numeroDocumento].reject({
                    message:
                        (!successUrlIsValid ? 'Resulting Url for stage ' + stage + ' is not one of ' + successUrls + '. It is ' + pageUrl + ' instead. /n' : '') +
                        (!matchesStageTraits ? 'Page traits for stage ' + stage + ' do not match success page configuration for session ' + pageId : ''),
                    reset: true
                });


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