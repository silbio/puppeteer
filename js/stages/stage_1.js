const utils = require("../utils");


module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            let btnAceptar = '#btnAceptar';
            let provinces = '#form'
            await page.waitForSelector(provinces)
            await page.waitForSelector(btnAceptar)
            let optionValue = await utils.getOptionValueFromInnerText(page, 'form', record.provincia);
            await page.select(`${provinces}`, optionValue);
            await page.click(btnAceptar);
            resolve({msg: 'Stage 1 done!'});


        } catch (err) {
            reject(err);
        }

    }
}
