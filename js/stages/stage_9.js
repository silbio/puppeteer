const coordinator = require('../coordinator')
module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.click('#chkTotal');
            await pages[pageId].page.click('#enviarCorreo');
            coordinator.addRequestTimestampToPageId(pageId, new Date().getTime()).then(() => {
                coordinator.getSmsCodeFromPageId(pageId).then(async (smsCode) => {
                    await pages[pageId].page.waitForSelector('#txtCodigoVerificacion');
                    await pages[pageId].page.focus('#txtCodigoVerificacion');
                    await pages[pageId].page.keyboard.type(smsCode);
                    await pages[pageId].page.click('#btnConfirmar')
                    resolve({msg: 'Stage 9 done!'});
                }).catch((err) => {
                    reject({message: err, reset: true});
                })
            }).catch((err) => {
                reject({message: err, reset: true});
            })
        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}
