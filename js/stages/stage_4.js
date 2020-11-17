const utils = require('../utils');
const captchaControl = require("../../../parrot_silb/captchaControl");

module.exports = {
    run: async function (pageId, record, resolve, reject) {
        try {

            if (pages[pageId].isReload) {
                await enableAndClick(pageId);
                resolve({msg: 'Stage 4 done!'});
            } else {
                let randomValues = {
                    documentType: 'PASAPORTE',
                    documentNumber: utils.getRandomAlphanumeric(3, 'letters') + utils.getRandomAlphanumeric(7, 'numbers'),
                    fullName: utils.getRandomNames(),
                    nationality: utils.getRandomCountry()
                }
//Document Type radio
                new Promise(async (formResolve) => {
                    let documentType = global.endGame ? record.tipoDocumento : randomValues.documentType;
                    await pages[pageId].page.click(`[name="rdbTipoDoc"][value="${documentType}"]`);
                    // Document Number field
                    await pages[pageId].page.focus('#txtIdCitado');
                    await pages[pageId].page.click('input[id=txtIdCitado]', {clickCount: 3});
                    let documentNumber = global.endGame ? record.numeroDocumento : randomValues.documentNumber;
                    await pages[pageId].page.keyboard.type(documentNumber);
                    // Name field

                    await pages[pageId].page.focus('#txtDesCitado');
                    await pages[pageId].page.click('input[id=txtDesCitado]', {clickCount: 3});
                    let fullName = global.endGame ? (record.nombres + ' ' + record.apellido1 + ' ' + record.apellido2).trim() : randomValues.fullName;
                    await pages[pageId].page.keyboard.type(fullName);
                    //Country Select
                    if (await pages[pageId].page.$('#txtPaisNac') !== null) {
                        let nationality = global.endGame ? record.nacionalidad : randomValues.nationality;
                        let optionValue = await utils.getOptionValueFromInnerText(pageId, 'txtPaisNac', nationality);
                        await pages[pageId].page.select('#txtPaisNac', optionValue);
                    }
                    if (await pages[pageId].page.$('#txtAnnoCitado') !== null) {
                        await pages[pageId].page.focus('#txtAnnoCitado');
                        await pages[pageId].page.click('input[id=txtAnnoCitado]', {clickCount: 3});
                        await pages[pageId].page.keyboard.type(global.endGame ? record.anoNacimiento : '1977');
                    }

                    if (await pages[pageId].page.$('#txtFecha') !== null && record.caducidadTarjeta !== '') {
                        await pages[pageId].page.focus('#txtFecha');
                        await pages[pageId].page.click('input[id=txtFecha]', {clickCount: 3});
                        await pages[pageId].page.keyboard.type(global.endGame ? record.caducidadTarjeta : '');
                    }
                    formResolve();

                }).then(async () => {
                        await enableAndClick(pageId);
                        resolve({msg: 'Stage 4 done!'});
                    }
                ).catch(err => {
                    reject({message: err, reset: true});
                });
            }
        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}


function enableAndClick(pageId) {
    return new Promise((resolve, reject) => {
        pages[pageId].page.evaluate(() => {
            if (window.hasOwnProperty('enableBtn')) {
                window.enableBtn();
                window.enableBtn = function () {
                    console.log('enableBtn ran');
                    return true;
                };
            } else {
                return true;
            }
        }).then(async () => {
            await pages[pageId].page.waitForTimeout(2000);
            await pages[pageId].page.click('#btnEnviar');
            resolve();
        }).catch((err) => {
            reject(err);
        });
    })

}