module.exports = {
    async run(pageId, record, resolve, reject) {
        try {

            if (await pages[pageId].page.$('[name="rdbCita"]') !== null) {
                await pages[pageId].page.click('[name="rdbCita"][value="1"]');
                await pages[pageId].page.click('#btnSiguiente');
                resolve({msg: 'Stage 8 done!'});
            } else if (await pages[pageId].page.$('#datepicker') !== null) {
                await pages[pageId].page.evaluate(
                    () => {
                       let slots = document.querySelectorAll('[id^=HUECO]');
                       slots[1].click();
                    });
                await pages[pageId].page.click('#btnSiguiente');
                //TODO => Trigger hitting system to send all other process/province identical requests.

                resolve({msg: 'Stage 8 done!'});
            } else {
                reject({message: 'Turn taken before reservation.', reset: true});
            }



        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
