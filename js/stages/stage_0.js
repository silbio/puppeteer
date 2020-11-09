module.exports = {
    async run(pageId, record, resolve, reject) {
        try {

            let submitBtn = '#submit';
            await pages[pageId].page.waitForSelector(submitBtn);
            await pages[pageId].page.click(submitBtn);
           resolve({msg: 'Stage 0 done!'});

        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
