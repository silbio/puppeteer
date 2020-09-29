module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {
await page.evaluate(()=>{
    confirm('Is this a test?')
})
            let submitBtn = '#submit';
            await page.waitForSelector(submitBtn);
            await page.click(submitBtn);
           resolve({msg: 'Stage 0 done!', reset: false});

        } catch (err) {
            reject(err);
        }

    }
}
