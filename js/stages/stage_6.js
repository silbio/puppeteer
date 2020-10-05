module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            let appointmentFound = await checkForButtons(pageId);

            if (appointmentFound) {
                logger.info('Appointment found for ' + pageId + ', filling form,');
                pages.click('#btnSiguiente');
                resolve('Stage 6 done!');
            } else {
                logger.debug('No appointment found, reloading ' + pageId + ' - ' + pages[pageId].reloadCounter + '/10');
                await pages[pageId].page.waitForTimeout(2000);
                await pages[pageId].page.reload();
                pages[pageId].reloadCounter++;
                if (pages[pageId].reloadCounter === 10) {
                    reject({message: 'Reloads exhausted for pageId' + pageId + ', restarting process!', reset: true});
                } else {
                    this.run(pageId, record, resolve, reject);
                }

            }


        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}

async function checkForButtons(pageId) {
    if (await pages[pageId].page.$('#btnSiguiente') !== null) {
        return true;
    } else if (await pages[pageId].page.$('#btnSalir') !== null) {
        return false;
    }
}

