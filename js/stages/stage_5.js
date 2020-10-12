const utils = require("../utils");
module.exports = {
    async run(pageId, record, resolve, reject) {
        try {
            let sendBtn = '#btnEnviar';
            await pages[pageId].page.waitForSelector(sendBtn);
            await pages[pageId].page.click(sendBtn);
            utils.removeSolvedCaptcha(pageId);
           resolve({msg: 'Stage 5 done!'});
//TODO => make it check for captcha element and get a new solved one.
        } catch (err) {
            reject({message: err, reset: false});
        }

    }
}
