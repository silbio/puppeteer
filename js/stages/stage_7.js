module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            await page.focus('#txtTelefonoCitado');
            await page.keyboard.type(record.telefono);
            await page.focus('#emailUNO');
            await page.keyboard.type(record.email);
            await page.focus('#emailDOS');
            await page.keyboard.type(record.email);
            if (await page.$('#txtObservaciones')) {
                await page.focus('#txtObservaciones');
                await page.keyboard.type(record.motivo);
            }
            await page.click('#btnSiguiente');
            resolve({msg: 'Stage 7 done!', reset: false});

        } catch (err) {
            reject(err);
        }

    }
}
