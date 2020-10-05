const utils = require('../utils');
module.exports = {
    run: async function (page, record, resolve, reject, pageId) {
        try {

//Document Type radio
            await page.waitForSelector('[name="rdbTipoDoc"]')
            await page.click(`[name="rdbTipoDoc"][value="${record.tipoDocumento}"]`);
            // Document Number field
            await page.focus('#txtIdCitado');
            await page.keyboard.type(record.numeroDocumento);
            // Name field
            await page.focus('#txtDesCitado');
            await page.keyboard.type(record.nombres + ' ' + record.apellido1 + ' ' + record.apellido2);
            //Country Select
            if (await page.$('#txtPaisNac') !== null) {
                let optionValue = await utils.getOptionValueFromInnerText(page, 'txtPaisNac', record.nacionalidad);
                await page.select('#txtPaisNac', optionValue);
            }
            if (await page.$('#txtAnnoCitado') !== null) {
                await page.focus('#txtAnnoCitado');
                await page.keyboard.type(record.anoNacimiento);
            }

            new Promise(resolve => {
                utils.getSolvedCaptcha(pageId, resolve)
            })
                .then(async (gRecaptchaResponse) => {
                    await page.waitForSelector('#g-recaptcha-response');
                    await page.evaluate((code) => {
                        window.enableBtn();
                        let rcta = document.getElementById('g-recaptcha-response');
                        console.log('Filling field ' + rcta +' with code ' + code);
                        rcta.innerText = code;
                    }, gRecaptchaResponse.code);
                    await page.click('#btnEnviar')
                    utils.removeSolvedCaptcha(pageId);
                    logger.debug('Captcha Resolution Field Filled!');
                    resolve({msg: 'Stage 4 done!'});
                }).catch(err => {
                reject(err)
            });

        } catch (err) {
            reject(err);
        }

    }
}


