module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {

            if (await page.$('[name="rdbCita"]') !== null) {
                await page.click('[name="rdbCita"][value="1"]');
            } else if (await page.$('#datepicker') !== null) {
                await page.evaluate(
                    () => {
                       let slots = document.querySelectorAll('[id^=HUECO]');
                       slots[1].click();
                    });
            } else {
                resolve({msg: 'Turn taken before reservation.', reset: true})
                return false;
            }
            await page.click('#btnSiguiente');
            resolve({msg: 'Stage 8 done!', reset: false});

        } catch (err) {
            reject(err);
        }

    }
}
