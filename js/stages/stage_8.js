module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {

            if (await page.$('[name="rdbCita"]') !== null) {
                await page.click('[name="rdbCita"][value="1"]');
                await page.click('#btnSiguiente');
                resolve({msg: 'Stage 8 done!'});
            } else if (await page.$('#datepicker') !== null) {
                await page.evaluate(
                    () => {
                       let slots = document.querySelectorAll('[id^=HUECO]');
                       slots[1].click();
                    });
                await page.click('#btnSiguiente');
                //TODO => Trigger hitting system to send all other process/province identical requests.

                resolve({msg: 'Stage 8 done!'});
            } else {
                reject({message: 'Turn taken before reservation.', reset: true});
            }



        } catch (err) {
            reject(err);
        }

    }
}
