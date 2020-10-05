module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {

            let enterBtn = '#btnEntrar';
            await page.waitForSelector(enterBtn);
            await page.click(enterBtn);
           resolve({msg: 'Stage 3 done!'});

        } catch (err) {
            reject(err);
        }

    }
}
