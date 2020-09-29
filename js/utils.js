const axios = require('axios');
const antiCaptchaClientKey = '0024131b365903ca5f32c9b2b1baf9ed';

let resolvedCaptchas = {}

module.exports = {
    getOptionValueFromInnerText: async (page, selectId, textToFind) => {
        const optionWanted = (
            await page.$x(`//*[@id = "${selectId}"]/option[text() = "${textToFind}"]`))[0];
        return await (
            await optionWanted.getProperty('value')
        ).jsonValue();
    },
    fetchCaptcha: (pageId) => {

        axios.post('http://api.anti-captcha.com/createTask', {
            'clientKey': antiCaptchaClientKey,
            'task':
                {
                    'type': 'NoCaptchaTaskProxyless',
                    'websiteURL': 'https://sede.administracionespublicas.gob.es/icpplustieb/acValidarEntrada',
                    'websiteKey': '6Ld3FzoUAAAAANGzDQ-ZfwyAArWaG2Ae15CGxkKt',
                    'userAgent': userAgent
                }
        })
            .then((response) => {

                let taskId = response.data.taskId
                let errorId = response.data.errorId;
                if (taskId) {
                    console.log('Task Id: ' + taskId)
                    new Promise((pollResolve, pollReject) => {
                        console.log('polling started');
                        pollTask(taskId, 0, pollResolve, pollReject)
                    }).then((solvedCaptcha) => {
                        resolvedCaptchas[pageId] = {
                            code: solvedCaptcha, timestamp: new Date().getTime()
                        };
                        return true;
                    }).catch((err) => {

                        console.error(err);
                        return false;
                    });
                } else if (errorId) {

                    console.error(errorId, response.data.errorCode, response.data.errorDescription);
                    return false;
                }

            })
            .catch(error => {

                console.error(error);
                return false;
            });
    },
    removeSolvedCaptcha(pageId) {
        delete resolvedCaptchas[pageId]
    },
    getSolvedCaptcha(pageId, resolve) {
        if (resolvedCaptchas[pageId]) {
            resolve(resolvedCaptchas[pageId]);

        } else {
            setTimeout(() => {
                this.getSolvedCaptcha(pageId, resolve);
            }, 500)
        }

    }
}

function pollTask(taskId, attempt, resolve, reject) {
    axios.post('https://api.anti-captcha.com/getTaskResult',
        {
            'clientKey': antiCaptchaClientKey,
            'taskId': taskId
        }).then(async (taskResponse) => {
        let gRecaptchaStatus = taskResponse.data.status

        if (gRecaptchaStatus === 'ready') {
            console.log('reCaptcha solution ready.')
            resolve(taskResponse.data.solution.gRecaptchaResponse);
        } else if (attempt > 20) {
            reject('Too many polling tries');
        } else {
            console.log('Attempts to poll: ' + attempt)
            attempt++;
            setTimeout(() => {
                pollTask(taskId, attempt, resolve, reject);
            }, 1000)
        }
    })

}