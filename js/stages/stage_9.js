const coordinator = require('../coordinator')
module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            await page.click('#chkTotal');
            await page.click('#enviarCorreo');
            coordinator.addRequestTimestampToPageId(pageId, new Date().getTime()).then(()=>{
                coordinator.getSmsCodeFromPageId(pageId).then(async (smsCode)=>{
                    await page.waitForSelector('#txtCodigoVerificacion');
                    await page.focus('#txtCodigoVerificacion');
                    await page.keyboard.type(smsCode);
                    await page.click('#btnConfirmar')
                    resolve({msg: 'Stage 9 done!'});
                }).catch((err)=>{reject(err)})
            }).catch((err)=>{reject(err)})
        } catch (err) {
            reject(err);
        }

    }
}
