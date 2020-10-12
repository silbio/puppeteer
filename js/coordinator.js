let keyPairs = [];

module.exports = {
    addPageId: (pageId, phoneId) => {
        logger.debug('PageId ' + pageId + ' was added to the coordinator keypairs. Assigned phone number is: ' + phoneId)
        keyPairs.push({pageId: pageId, phoneId: phoneId});
    },
    addRequestTimestampToPageId: (pageId, timestamp) => {
        return new Promise((resolve, reject) => {
            let foundKeypair = keyPairs.find(pair => {
                if (pair.pageId === pageId) {
                    pair.pageTimestamp = timestamp;
                    return true
                }
            });
            if (foundKeypair) {
                resolve('Request Timestamp added to pageId: ' + pageId);
            } else {
                reject({message: 'Couldn\'t find pageId ' + pageId + ' in coordinator Key Pairs.', reset: true});
            }

        })

    },
    addSmsCode: (smsCode, slot, timestamp) => {
        return new Promise((resolve) => {
            for (let pair of keyPairs) {
                if (!pair.hasOwnProperty('smsCode')) {
                    pair['smsCode'] = smsCode;
                    pair['smsTimestamp'] = parseInt(timestamp);
                    pair['receivingNumber'] = ['644354712', '644378714'][slot];
                    resolve('SMS Code ' + smsCode + ' added to coordinator pair successfully for pageId' + pair['pageId']);
                    break;
                }
            }
        })
    },
    getSmsCodeFromPageId: async (pageId, phoneNumber) => {
        return new Promise((resolve, reject) => {
            retrieveCode(pageId, phoneNumber, resolve, reject);
        });
    }
}


async function retrieveCode(pageId, phoneNumber,resolve, reject) {
    let matchingPair = keyPairs.find(pair => pair.pageId === pageId);
    matchingPair.smsAttempts = matchingPair.smsAttempts ? matchingPair.smsAttempts + 1 : 1;
    if (matchingPair.smsCode) {
        logger.debug('Time difference between requesting SMS and getting it: ' + (matchingPair.pageTimestamp - matchingPair.smsTimestamp) +'\n Phone number expected: ' + matchingPair.phoneId + ' phone number received: ' + phoneNumber);
        resolve(matchingPair.smsCode);
    } else {
        setTimeout(() => {
            if (matchingPair.smsAttempts < 120) {
                retrieveCode(pageId,phoneNumber, resolve, reject);
            } else {
                reject({message: 'Too many attempts to retrieve SMS, restarting.', reset: true})
            }

        }, 1000)
    }
}