const exec = require('child_process').exec;
module.exports = {
    getRandomPhoneNumber: () => {
        let phones = ['644354712', '644378714'];
        return phones[(Math.floor(Math.random() * phones.length))]
    },
    getRandomEmailAddress: () => {
        let emails = ['extranjeros@yopmail.com', 'extranjeria@yopmail.com', 'turnos@yopmail.com', 'citaprevia@yopmail.com'];
        return emails[(Math.floor(Math.random() * emails.length))]
    },
    getRandomAlphanumeric: (length, type) => {
        let result = '';
        let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let numbers = '0123456789';
        let characters = type === 'letters' ? letters : numbers;
        let typeLength = characters.length;

        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * typeLength));
        }
        return result;
    },
    getRandomNames: () => {
        let names = ['Antonio', 'Manuel', 'Jose', 'Francisco', 'David', 'Juan', 'José Antonio', 'Javier', 'Daniel', 'José Luis', 'Francisco Javier', 'Carlos', 'Jesús', 'Alejandro', 'Miguel', 'José Manuel', 'Rafael', 'Miguel Ángel', 'Pedro', 'Pablo']
        let surnames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez']
        return names[(Math.floor(Math.random() * names.length))] + ' ' + surnames[(Math.floor(Math.random() * surnames.length))] + ' ' + surnames[(Math.floor(Math.random() * surnames.length))];
    },
    getRandomCountry: () => {
        let countries = ['ARGENTINA', 'BOLIVIA', 'CHILE', 'COLOMBIA', 'COSTA RICA', 'CUBA', 'DOMINICANA REPUBLICA', 'ECUADOR', 'EL SALVADOR', 'GUATEMALA', 'HONDURAS', 'MEJICO', 'NICARAGUA', 'PANAMA', 'PARAGUAY', 'PERU', 'URUGUAY', 'VENEZUELA']
        return countries[(Math.floor(Math.random() * countries.length))]
    },
    getTimeStampInLocaLIso: () => {
        return (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
    },
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
    waitForSms: (simSlot) => {
        return new Promise(resolve => {
            let smsInterval = setInterval(async () => {
                if (simSlots[simSlot].smsCode) {
                    clearInterval(smsInterval);
                    resolve();
                }
            }, 1000);
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
    connectVpn: () => {
        //IP address randomization over ProtonVPN - Use visudo to allow user to run command as root.
        return new Promise((resolve, reject) => {
            let startVPN = exec("sudo protonvpn c -r", function (err, stdout, stderr) {
                if (err) {
                    logger.error(stderr);
                }
                console.log(stdout);
            });

            startVPN.on('exit', async (code) => {
                if (code === 0) {
                    resolve('VPN started successfully.');
                } else {
                    reject('VPN could not be started, exited with code: ' + code);

                }
            });
        })
    },
    disconnectVpn: () => {
        return new Promise((resolve, reject) => {
            let stopVPN = exec("sudo protonvpn d", function (err, stdout, stderr) {
                if (err) {
                    logger.error(stderr);
                }
                logger.debug(stdout);
            });

            stopVPN.on('exit', (code) => {
                if (code === 0) {
                    resolve('VPN stopped successfully.');
                } else {
                    reject('VPN could not be stopped gracefully, exited with code: ' + code);
                }
            });
        });
    }
}

