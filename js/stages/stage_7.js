module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.focus('#txtTelefonoCitado');
            await pages[pageId].page.keyboard.type(record.telefono);
            await pages[pageId].page.focus('#emailUNO');
            await pages[pageId].page.keyboard.type(record.email);
            await pages[pageId].page.focus('#emailDOS');
            await pages[pageId].page.keyboard.type(record.email);
            if (await pages[pageId].page.$('#txtObservaciones')) {
                await pages[pageId].page.focus('#txtObservaciones');
                await pages[pageId].page.keyboard.type(record.motivo);
            }
            await pages[pageId].page.click('#btnSiguiente');
            resolve({msg: 'Stage 7 done!'});

        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
