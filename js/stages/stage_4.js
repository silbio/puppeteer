const utils = require('../utils');
module.exports = {
    run: async function (pageId, record, resolve, reject) {
        try {

//Document Type radio

  let   formPromise =   new Promise    (async (resolve) => {

                await pages[pageId].page.waitForSelector('[name="rdbTipoDoc"]');
                await pages[pageId].page.click(`[name="rdbTipoDoc"][value="${record.tipoDocumento}"]`);
                // Document Number field
                await pages[pageId].page.focus('#txtIdCitado');
                await pages[pageId].page.keyboard.type(record.numeroDocumento);
                // Name field
                await pages[pageId].page.focus('#txtDesCitado');
                await pages[pageId].page.keyboard.type(record.nombres + ' ' + record.apellido1 + ' ' + record.apellido2);
                //Country Select
                if (await pages[pageId].page.$('#txtPaisNac') !== null) {
                    let optionValue = await utils.getOptionValueFromInnerText(pageId, 'txtPaisNac', record.nacionalidad);
                    await pages[pageId].page.select('#txtPaisNac', optionValue);
                }
                if (await pages[pageId].page.$('#txtAnnoCitado') !== null) {
                    await pages[pageId].page.focus('#txtAnnoCitado');
                    await pages[pageId].page.keyboard.type(record.anoNacimiento);
                }
                resolve();
            })
       let captchaPromise = new Promise((resolve) => {
                utils.getSolvedCaptcha(pageId, resolve);
            })

               Promise.all([formPromise, captchaPromise])
                   .then(async (results) => {
                   let gRecaptchaResponse = results[1];
                    await pages[pageId].page.waitForSelector('#g-recaptcha-response');
                    await pages[pageId].page.evaluate((code) => {
                        window.enableBtn();
                        let rcta = document.getElementById('g-recaptcha-response');
                        console.log('Filling field ' + rcta +' with code ' + code);
                        rcta.innerText = code;
                    }, gRecaptchaResponse.code);
                    await pages[pageId].page.click('#btnEnviar')
                    utils.removeSolvedCaptcha(pageId);
                    logger.debug('Captcha Resolution Field Filled!');
                    resolve({msg: 'Stage 4 done!'});
                }).catch(err => {
                reject({message: err, reset: true});
            });

        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}


