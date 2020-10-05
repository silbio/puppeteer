

module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            let appointmentFound = await checkForButtons(page);

            if (appointmentFound) {
                logger.info('Appointment found for ' + pageId +', filling form,');
                page.click('#btnSiguiente');
                resolve('Stage 6 done!');
            } else {
                logger.debug('No appointment found, reloading ' + reloadCounter + '/10');
                await page.waitForTimeout(2000);
                await page.reload();
                reloadCounter++;
                if(reloadCounter === 10){
                    reject({message: 'Reloads exhausted, restarting process!', reset: true});
                }
                else{
                    this.run(page, record, resolve, reject);
                }

            }


        } catch (err) {
            reject(err);
        }

    }
}

async function checkForButtons(page) {
    if (await page.$('#btnSiguiente') !== null) {
        return true;
    } else if (await page.$('#btnSalir') !== null) {
        return false;
    }
}

let reloadCounter = 0;