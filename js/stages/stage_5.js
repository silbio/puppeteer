module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            let sendBtn = '#btnEnviar';
            await page.waitForSelector(sendBtn);
            await page.click(sendBtn);
           resolve({msg: 'Stage 5 done!', reset: false});

        } catch (err) {
            reject(err);
        }

    }
}
