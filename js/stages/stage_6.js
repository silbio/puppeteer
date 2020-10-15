module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            let appointmentFound = await checkForButtons(pageId);

            if (appointmentFound) {
                logger.info('Appointment found for ' + pageId + ', filling form,');
                await pages[pageId].page.click('#btnSiguiente');
                resolve({msg:'Stage 6 done!'});
            } else if(await pages[pageId].page.$('#btnSalir') !== null){
                logger.debug('No appointment found, reloading ' + pageId + ' - ' + pages[pageId].reloadCounter + '/10');
                await pages[pageId].page.waitForTimeout(global.tryInterval);
                await pages[pageId].page.goBack();
                resolve({msg:'Stage 6 reloaded!'})
            }
            else{
                reject({message: "Site error, probably session timeout, closing window and restarting.", reset: true})
            }


        } catch (err) {
            reject({message: err, reset: false});
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

