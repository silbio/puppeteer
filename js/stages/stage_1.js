const utils = require("../utils");


module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            //    let btnAceptar = '#btnAceptar';
            let provinces = '#form'
            await pages[pageId].page.waitForSelector(provinces);
            let optionValue = await utils.getOptionValueFromInnerText(pageId, 'form', record.provincia);
            await pages[pageId].page.select(`${provinces}`, optionValue);
            if (await pages[pageId].page.$('#cookie_action_close_header') !== null ) {
                await pages[pageId].page.click('#cookie_action_close_header');
            }
            await pages[pageId].page.evaluate(
                () => {
                   window.envia();
                });
            resolve({msg: 'Stage 1 done!'})
        } catch (err) {
                reject({message: err, reset: false});
            }
        }}

