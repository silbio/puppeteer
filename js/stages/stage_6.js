module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            await pages[pageId].page.click('#btnSiguiente');
            resolve({msg: 'Stage 6 done!'});
        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}


