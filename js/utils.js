const axios = require('axios');
const antiCaptchaClientKey = '0024131b365903ca5f32c9b2b1baf9ed';

let resolvedCaptchas = {}

module.exports = {

    getProcessEnumOrName: (processId) => {
        const processes = {
            0: 'POLICIA - RECOGIDA DE TARJETA DE IDENTIDAD DE EXTRANJERO (TIE)',
            1: 'POLICIA- EXPEDICIÓN/RENOVACIÓN DE DOCUMENTOS DE SOLICITANTES DE ASILO',
            2: 'POLICIA- SOLICITUD ASILO',
            3: 'POLICIA-AUTORIZACIÓN DE REGRESO',
            4: 'POLICIA-CARTA DE INVITACIÓN',
            5: 'POLICIA-CERTIFICADO DE REGISTRO DE CIUDADANO DE LA U.E.',
            6: 'POLICIA-CERTIFICADOS (DE RESIDENCIA, DE NO RESIDENCIA Y DE CONCORDANCIA)',
            7: 'POLICIA-CERTIFICADOS UE',
            8: 'POLICIA-CERTIFICADOS Y ASIGNACION NIE',
            9: 'POLICIA-CERTIFICADOS Y ASIGNACION NIE (NO COMUNITARIOS)',
            10: 'POLICÍA-EXP.TARJETA ASOCIADA AL ACUERDO DE RETIRADA CIUDADANOS BRITÁNICOS Y SUS FAMILIARES (BREXIT)',
            11: 'POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN',
            12: 'SOLICITUD DE AUTORIZACIONES',
            13: 'REGISTRO',
            14: 'ASILO-OFICINA DE ASILO Y REFUGIO."nueva normalidad" Expedición/Renovación Documentos.C/Pradillo 40',
            15: 'AUT. DE RESIDENCIA TEMPORAL POR CIRCUNS. EXCEPCIONALES POR ARRAIGO',
            16: 'AUTORIZACIÓN DE RESIDENCIA DE MENORES',
            17: 'AUTORIZACIÓN ESTANCIA INICIAL POR ESTUDIOS',
            18: 'AUTORIZACIONES DE TRABAJO',
            19: 'FAMILIARES DE RESIDENTES COMUNITARIOS',
            20: 'INFORMACIÓN',
            21: 'REAGRUPACIÓN FAMILIAR',
            22: 'Recuperación de la autorización de larga duración',
            23: 'POLICIA-OTROS TRÁMITES COMISARIA',
            24: 'AUTORIZACIÓN DE RESIDENCIA POR ARRAIGO',
            25: 'AUTORIZACIÓN PARA TRABAJAR',
            26: 'AUTORIZACIÓN DE RESIDENCIA Y TRABAJO INICIAL POR CUENTA PROPIA',
            27: 'RENOVACIONES TRABAJO',
            28: 'OTROS TRABAJO',
            29: 'COMUNITARIOS',
            30: 'RENOVACIONES RESIDENCIA',
            31: 'AUT. RESIDENCIA POR OTRAS CIRCUNSTANCIAS EXCEPCIONALES',
            32: 'AUTORIZACIÓN DE ESTANCIA POR ESTUDIOS',
            33: 'CÉDULA DE INSCRIPCIÓN Y TÍTULO DE VIAJE',
            34: 'OTROS RESIDENCIA'
        }
        if (typeof processId === 'number') {
            return processes[processId];
        } else {
            for (let processNumber in processes) {
                if (processes[processNumber] === processId) {
                    return processNumber;
                }
            }
        }
    },
    waitForSimLock: (simSlot) => {
        return new Promise(resolve => {
            let simLockInterval = setInterval(async () => {
                if (!simSlots[simSlot].locked) {
                    simSlots[simSlot].locked = true;
                    simSlots[simSlot].smsCode = null;
                    clearInterval(simLockInterval);
                    resolve();
                }
            }, 1000);
        })
    },
    waitForSms: (simSlot)=>{
        return new Promise( resolve => {
            let smsInterval = setInterval(async () => {
                if (simSlots[simSlot].smsCode) {
                    clearInterval(smsInterval);
                    resolve();
                }
            }, 1000);
        })
    },
    getPhoneOrSimSlotNumber: (number) => {
        //Get phone number from SIM slot
        if (/^slot[01]$/.test(number)) {
            return simSlots[number].phoneNumber;
        } else {
            //Get SIM slot from phone number
            for (let simSlotDataPoint in simSlots) {
                if (simSlotDataPoint.phoneNumber === number) {
                    return number;
                }
            }
        }
    },
    getOptionValueFromInnerText: async (pageId, selectId, textToFind) => {
        const optionWanted = (
            await pages[pageId].page.$x(`//*[@id = "${selectId}"]/option[text() = "${textToFind}"]`))[0];
        return await (
            await optionWanted.getProperty('value')
        ).jsonValue();
    },
    fetchCaptcha: (pageId) => {
        return new Promise((resolve, reject) => {
            logger.info('Captcha for pageId: ' + pageId + ' requested.')
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
                        logger.debug('Captcha service for task Id: ' + taskId + ' for pageId ' + pageId);
                        new Promise((pollResolve, pollReject) => {
                            logger.debug('Polling for captcha solution started for pageId ' + pageId);
                            pollTask(taskId, 0, pollResolve, pollReject, pageId)
                        }).then((solvedCaptcha) => {
                            resolvedCaptchas[pageId] = {
                                code: solvedCaptcha, timestamp: new Date().getTime()
                            };

                        }).catch((err) => {

                            reject({message: err, reset: true});

                        });
                    } else if (errorId) {
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
        })
    },
    checkPageIdTraits: async (pageId, selector, expectedContent) => {
        try {
            let element = await pages[pageId].page.$(selector);
            let elementProperty = await element.getProperty('innerText');
            let elementContent = elementProperty._remoteObject.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return elementContent.indexOf(expectedContent) > -1
        } catch (e) {
            return false;
        }
    },
    removeSolvedCaptcha(pageId) {
        delete resolvedCaptchas[pageId]
    },
    getSolvedCaptcha(pageId, resolve) {
        if (resolvedCaptchas[pageId]) {
            resolve(resolvedCaptchas[pageId].code);

        } else {
            setTimeout(() => {
                this.getSolvedCaptcha(pageId, resolve);
            }, 500)
        }

    }
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