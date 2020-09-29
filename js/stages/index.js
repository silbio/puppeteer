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
    ['https://sede.administracionespublicas.gob.es/icpplus/acOfertarCita','https://sede.administracionespublicas.gob.es/icpplustieb/acOfertarCita'],
    ['https://sede.administracionespublicas.gob.es/icpplus/acVerificarCita','https://sede.administracionespublicas.gob.es/icpplustieb/acVerificarCita']
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
let mainPromises = {}

function init(page, record, resolve, reject, pageId) {

    iterate(page, record, 0, pageId);
    mainPromises[record.numeroDocumento] = {resolve: resolve, reject: reject}

}

let lastPage = '';

function iterate(page, record, stage, pageId) {
    let navPromise = page.waitForNavigation();
    let processPromise = new Promise((resolve, reject) => {
        processes[stage].run(page, record, resolve, reject, pageId);
    })
    let pageMetrics = page.metrics();

    Promise.all([processPromise, navPromise, pageMetrics])
        .then((results) => {
            let stageReloaded = false;
            let processResolution = results[0];
            console.log('Stage ' + stage + ' finished with resolution: ' + processResolution.msg + '.\n' + JSON.stringify(results[2]));
            //Restart window if needed
            if(processResolution.reset){
                page.close();
                mainPromises[record.numeroDocumento].resolve('reset');
            }
            let navigationResolution = results[1];


            let pageUrl = navigationResolution._url.split(/[?;]/)[0];
            let successUrl = successPages[stage];


            if (pageUrl === lastPage) {
                stageReloaded = true;
                console.log('Stage ' + stage + ' was reloaded.')
            }
            console.log(stage + '/' + (numberOfStages - 1), pageUrl, successUrl);
            if (successUrl.includes(pageUrl)) {
               if(!stageReloaded) {
                   stage++;
               }
                lastPage = pageUrl;
                if (stage === numberOfStages) {
                    mainPromises[record.numeroDocumento].resolve('success');
                } else {

                    iterate(page, record, stage, pageId);
                }
            } else {
                mainPromises[record.numeroDocumento].reject('Resulting Url for stage ' + stage + ' is not one of ' + successUrl + '. It is ' + pageUrl + ' instead.');
            }

        }).catch((err) => {

        mainPromises[record.numeroDocumento].reject(
            `Error running stage ${stage} code.
    Error Message: 
    ${err.message}
    ${err.stack}
    `
        )
    })
}

module.exports = {init}