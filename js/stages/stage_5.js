module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
            let sendBtn = '#btnEnviar';
            await page.waitForSelector(sendBtn);
            await page.click(sendBtn);
           resolve({msg: 'Stage 5 done!'});
//TODO => make it check for captcha element and get a new solved one.
        } catch (err) {
            reject(err);
        }

    }
}
