const utils = require('../utils');
module.exports = {
    run: async function (pageId, record, resolve, reject) {
        try {

//Document Type radio
            new Promise((captchaResolve) => {
                utils.getSolvedCaptcha(pageId, captchaResolve);
            }).then(async (captchaCode)=>{
                new Promise(async (resolve)=>{
                    await pages[pageId].page.waitForFunction((code) => {
                        window.enableBtn();
                        let rcta = document.getElementById('g-recaptcha-response');
                        console.log('Filling field ' + rcta + ' with code ' + code);
                        rcta.innerText = code;
                        return true;
                    }, {}, captchaCode);
                    logger.debug('Captcha Resolution Field Filled for PageId: ' + pageId);
                    resolve();
                }).then(()=>{
                    new Promise(async (formResolve) => {

                        await pages[pageId].page.click(`[name="rdbTipoDoc"][value="${record.tipoDocumento}"]`);
                        // Document Number field
                        await pages[pageId].page.focus('#txtIdCitado');
                        await pages[pageId].page.keyboard.type(record.numeroDocumento);
                        // Name field
                        await pages[pageId].page.focus('#txtDesCitado');
                        let nameInput = await pages[pageId].page.$('#txtDesCitado');
                        await nameInput.click({ clickCount: 3 })
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
                        formResolve();
                    }).then(async ()=>{
                        await pages[pageId].page.click('#btnEnviar');
                        resolve({msg: 'Stage 4 done!'});
                    })

                });

            }).catch(err => {
                reject({message: err, reset: true});
            });

        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}


