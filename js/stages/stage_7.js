const utils = require('../utils');

module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            let phoneNumber = global.endGame ? record.telefono : utils.getRandomPhoneNumber();
            let emailAddress = global.endGame ? record.email : utils.getRandomEmailAddress();
            logger.info('Appointment found for ' + pageId + ', filling form,');
            await pages[pageId].page.focus('#txtTelefonoCitado');
            await pages[pageId].page.keyboard.type(phoneNumber);
            await pages[pageId].page.focus('#emailUNO');
            await pages[pageId].page.keyboard.type(emailAddress);
            await pages[pageId].page.focus('#emailDOS');
            await pages[pageId].page.keyboard.type(emailAddress);
            if (await pages[pageId].page.$('#txtObservaciones')) {
                await pages[pageId].page.focus('#txtObservaciones');
                await pages[pageId].page.keyboard.type(record.motivo);
            }

            await pages[pageId].page.click('#btnSiguiente');
            resolve({msg: 'Stage 7 done!'});

        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}
