const utils = require('../utils')

module.exports = {
    async run(pageId, record, resolve, reject) {
        try {

            if (process.env.NODE_ENV) {
                await pages[pageId].page.screenshot({path: 'logs/screenshots/' + utils.getTimeStampInLocaLIso() + '_stage_6_' + pageId + '.png'});
                pages[pageId].page.$eval('#idSede', (officeSelect) => {
                    let officesString = '';
                    for (let i = 0; i < officeSelect.length; i++) {
                        officesString += officeSelect[i].innerText + '\n'
                        if (i === officeSelect.length - 1) {
                            return officesString
                        }
                    }
                }).then((officesString) => {
                    logger.debug('Available offices in Stage 6 success \n' + officesString);
                });
            }


           await pages[pageId].page.click('#btnSiguiente');
           resolve({msg: 'Stage 6 done!'});
        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}


