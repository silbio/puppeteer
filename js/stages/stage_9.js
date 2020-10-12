const coordinator = require('../coordinator')
module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.click('#chkTotal');
            await pages[pageId].page.click('#enviarCorreo');
            coordinator.addRequestTimestampToPageId(pageId, new Date().getTime()).then(() => {
                coordinator.getSmsCodeFromPageId(pageId, record.telefono).then(async (smsCode) => {
                    await pages[pageId].page.waitForSelector('#txtCodigoVerificacion');
                    await pages[pageId].page.focus('#txtCodigoVerificacion');
                    await pages[pageId].page.keyboard.type(smsCode);
                    await pages[pageId].page.click('#btnConfirmar')
                    if(record.probing){
                        resolve({msg: 'Stage 9 done with Probing data, initializing striking system.', strikingData: record.striking});
                    }
                    else{
                        resolve({msg: 'Stage 9 done!'});
                    }
                }).catch((err) => {
                    reject( err);
                })
            }).catch((err) => {
                reject( err);
            })
        } catch (err) {
            reject(err);
        }

    }
}
