module.exports = {
    async run(pageId, record, resolve, reject) {
        try {

            let enterBtn = '#btnEntrar';
            await pages[pageId].page.waitForSelector(enterBtn);
            await pages[pageId].page.click(enterBtn);
           resolve({msg: 'Stage 3 done!'});

        } catch (err) {
            reject({message: err, reset: true});
        }

    }
}
