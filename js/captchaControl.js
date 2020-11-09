const axios = require('axios');
const antiCaptchaClientKey = '0024131b365903ca5f32c9b2b1baf9ed';

let resolvedCaptchas = {};
let resolvingCaptchas = [];
module.exports = {
    detect: (pageId) => {
        return new Promise(((resolve) => {
            pages[pageId].page.evaluate(() => {
                let captchaAttributes = {siteKey: '', isInvisible: null};

                if (document.querySelectorAll('[data-sitekey]').length > 0) {
                    captchaAttributes.siteKey = document.querySelectorAll('[data-sitekey]')[0].dataset.sitekey;
                    captchaAttributes.isInvisible = false;
                } else if (document.getElementById('reCAPTCHA_site_key') !== null) {
                    captchaAttributes.siteKey = document.getElementById('reCAPTCHA_site_key').value;
                    captchaAttributes.isInvisible = true;
                }
                return captchaAttributes;
            }).then((options) => {
                logger.debug( options.siteKey ? (options.isInvisible ? 'Inv' : 'V') + 'isible Captcha siteKey ' + options.siteKey  : 'No Captcha detected on this URL')
                resolve(options);
            })
        }))

    },
    request: (pageId, options) => {
        return new Promise((resolve, reject) => {
            logger.debug('Captcha for pageId: ' + pageId + ' requested.');
            if (resolvedCaptchas[pageId] || resolvingCaptchas.includes(pageId)) {
                resolve(resolvedCaptchas[pageId]);
            } else {
                axios.post('http://api.anti-captcha.com/createTask', {
                    'clientKey': antiCaptchaClientKey,
                    'task':
                        {
                            'type': 'NoCaptchaTaskProxyless',
                            'websiteURL': 'https://sede.administracionespublicas.gob.es',
                            'websiteKey': options.siteKey,
                            'isInvisible': options.isInvisible

                        }
                })
                    .then((response) => {

                        let taskId = response.data.taskId
                        let errorId = response.data.errorId;
                        if (taskId) {
                            logger.debug('Captcha service for task Id: ' + taskId + ' for pageId ' + pageId);
                            pages[pageId].taskId = taskId;
                            new Promise((pollResolve, pollReject) => {
                                logger.debug('Polling for captcha solution started for pageId ' + pageId);
                                pollTask(taskId, 0, pollResolve, pollReject, pageId)
                            }).then((solvedCaptcha) => {
                                let resolvedCaptchaIndex = resolvingCaptchas.indexOf(pageId);
                                resolvingCaptchas.splice(resolvedCaptchaIndex, 1);
                                resolvedCaptchas[pageId] = {
                                    code: solvedCaptcha, timestamp: new Date().getTime()
                                };
                                resolve(resolvedCaptchas[pageId]);

                            }).catch((err) => {
                                pages[pageId].page.close();
                                reject({message: err, reset: true});

                            });
                        } else if (errorId) {
                            pages[pageId].page.close();
                            reject({
                                message: `${errorId} - 
                        ${response.data.errorCode} -  
                        ${response.data.errorDescription}`, reset: true
                            });
                        }
                    })
                    .catch(error => {
                        reject({message: error, reset: true})
                    });
            }
        })
    },

    getSolved(pageId) {
        return new Promise((resolve) => {
            if (resolvedCaptchas[pageId]) {
                resolve(resolvedCaptchas[pageId].code);
            } else {
                setTimeout(() => {
                    this.getSolved(pageId);
                }, 500)
            }
        })


    },
    fillField(captchaCode, pageId) {
        return new Promise(async (resolve) => {
            await pages[pageId].page.waitForFunction((code) => {
                let captchaTextArea = document.getElementById('g-recaptcha-response');
                console.log('Filling field ' + captchaTextArea.id + ' with code ' + code);
                captchaTextArea.innerText = code;
                return true;
            }, {}, captchaCode);
            logger.debug('Captcha Resolution Field Filled for PageId: ' + pageId);
            delete resolvedCaptchas[pageId];
            resolve();
        });
    },
    reportIncorrect(pageId) {
        axios.post('https://api.anti-captcha.com/reportIncorrectRecaptcha', {
            'clientKey': antiCaptchaClientKey,
            'taskId': pages[pageId].taskId
        })
            .then((response) => {
                logger.info('ReCaptcha failure reported with result: ' + JSON.stringify(response.data));
            });

    },

}

function pollTask(taskId, attempt, resolve, reject, pageId) {

    axios.post('https://api.anti-captcha.com/getTaskResult',
        {
            'clientKey': antiCaptchaClientKey,
            'taskId': taskId
        }).then(async (taskResponse) => {
        let gRecaptchaStatus = taskResponse.data.status

        if (gRecaptchaStatus === 'ready') {
            logger.info('reCaptcha solution for ' + pageId + ' ready.')
            resolve(taskResponse.data.solution.gRecaptchaResponse);
        } else if (attempt > 30) {
            reject('Too many polling tries for pageId: ' + pageId);
        } else {
            logger.debug(attempt + ' attempts to poll for pageId: ' + pageId);
            attempt++;
            setTimeout(() => {
                pollTask(taskId, attempt, resolve, reject, pageId);
            }, 1000)
        }
    })

}