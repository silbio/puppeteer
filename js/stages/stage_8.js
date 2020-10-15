const utils = require('../utils');

module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.screenshot({path: 'stage8_' + pageId + '.png'});
            if (await pages[pageId].page.$('[name="rdbCita"]') !== null) {
                await pages[pageId].page.click('[name="rdbCita"][value="1"]');

                utils.waitForSimLock(record.simSlot).then(async () => {
                    await pages[pageId].page.click('#btnSiguiente');
                    resolve({msg: 'Stage 8 done!'});
                })


            } else if (await pages[pageId].page.$('#datepicker') !== null) {
                utils.waitForSimLock(record.simSlot).then(async () => {
                    await pages[pageId].page.evaluate(
                        () => {
                            let slots = document.querySelectorAll('[id^=HUECO]');
                            slots[0].click();
                        });
                    resolve({msg: 'Stage 8 done!'})
                })


            } else {
                reject({message: 'Turn taken before reservation.', reset: true});
            }


        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
