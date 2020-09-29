const utils = require('../utils');
module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            //Send reCaptcha for solving


//Document Type radio
            await page.click(`[name="rdbTipoDoc"][value="${record.tipoDocumento}"]`);
            // Document Number field
            await page.focus('#txtIdCitado');
            await page.keyboard.type(record.numeroDocumento);
            // Name field
            await page.focus('#txtDesCitado');
            await page.keyboard.type(record.nombres + ' ' + record.apellido1 + ' ' + record.apellido2);
            //Country Select
            if(await page.$('#txtPaisNac') !== null) {
                let optionValue = await utils.getOptionValueFromInnerText(page, 'txtPaisNac', record.nacionalidad);
                await page.select('#txtPaisNac', optionValue);
            }
            if(await page.$('#txtAnnoCitado') !== null) {
                await page.focus('#txtAnnoCitado');
                await page.keyboard.type(record.anoNacimiento);
            }

            new Promise(resolve => {
                utils.getSolvedCaptcha(pageId, resolve)
            })
                .then(async (gRecaptchaResponse) => {
                    await page.waitForSelector('#g-recaptcha-response');
                    await page.evaluate((gRecaptchaResponse) => {
                        console.log(gRecaptchaResponse);
                        let rcta = document.getElementById('g-recaptcha-response');
                        rcta.innerText = gRecaptchaResponse.code;
                        window.enableBtn();
                        window.envia();

                    }, gRecaptchaResponse);
                    utils.removeSolvedCaptcha(pageId);
                    resolve({msg: 'Stage 4 done!', reset: false});
                }).catch(err => {
                reject(err)
            });

        } catch (err) {
            reject(err);
        }

    }
}


