const utils = require('../utils');
const manualInputOfSMSCode = true;

module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.click('#chkTotal');
            await pages[pageId].page.click('#enviarCorreo');

           if(manualInputOfSMSCode) {
               pages[pageId].page.evaluate(()=>{

                   window.enviame = window.envia
                   window.envia = function (){
                       console.log('envia ran');
                       window.enviame();
                       return true;
                   };
               }).then(()=>{
                   resolve({msg: 'Stage 9 done!'});
               }).catch((err)=> {
                   reject(err);
               })
           }else{
                utils.waitForSms(record.simSlot).then(async () => {
                    await pages[pageId].page.waitForSelector('#txtCodigoVerificacion');
                    await pages[pageId].page.focus('#txtCodigoVerificacion');
                    await pages[pageId].page.keyboard.type(simSlots[record.simSlot].smsCode);
                    simSlots[record.simSlot].locked = false;
                    //Final confirmation button, uncomment on prod
                    await pages[pageId].page.click('#btnConfirmar')
                    if (record.probing) {
                        resolve({
                            msg: 'Stage 9 done with Probing data, initializing striking system.',
                            strikingData: record.striking
                        });
                    } else {
                        resolve({msg: 'Stage 9 done!'});
                    }
                }).catch((err) => {
                    reject(err);
                })
            }

        } catch (err) {
            reject(err);
        }

    }
}
