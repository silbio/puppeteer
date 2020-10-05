module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            let submitBtn = '#submit';
            await page.waitForSelector(submitBtn);
            await page.click(submitBtn);
           resolve({msg: 'Stage 0 done!'});

        } catch (err) {
            reject(err);
        }

    }
}
