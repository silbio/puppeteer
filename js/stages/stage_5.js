const captchaControl = require("../captchaControl");
module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            let sendBtn = '#btnEnviar';
            // await pages[pageId].page.waitForSelector(sendBtn);
           await pages[pageId].page.click(sendBtn);
           resolve({msg: 'Stage 5 done!'});
        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
