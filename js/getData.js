const {google} = require('googleapis');
let privateKey = require("../res/privateKey.json");
const spreadsheetId = '1LhpqxpRBJeE2ywUZtnkXyLuv74j3yKrM53VAxwDCUSA';
const phoneNumbers = [simSlots.slot0.phoneNumber, simSlots.slot1.phoneNumber];
const emails = ['t7aXoTwk@yandex.com', 'd0Mt4lKQ@yandex.com'];
//XoDNZQ77uslp
//xQLFTGeSkcg8

function init() {
    return new Promise((resolve, reject) => {
        // configure a JWT auth client
            let jwtClient = new google.auth.JWT(
                privateKey.client_email,
                null,
                privateKey.private_key,
                ['https://www.googleapis.com/auth/spreadsheets']);
//authenticate request
            jwtClient.authorize(function (err) {
                if (err) {
                    reject(err)
                } else {
                    resolve(jwtClient);
                }
            });

    });
}

function populateDataMap(auth) {
    return new Promise((resolve, reject) => {
            //Get proceeding data from sheet
            let returnData = [];
            const sheets = google.sheets({version: 'v4', auth});
            sheets.spreadsheets.values.batchGet({
                spreadsheetId: spreadsheetId,
                ranges: ['expedientes!A2:M99', 'data!F2'],
            }, (err, res) => {
                if (err) {
                    reject('The API returned an error: ' + err);
                }
                const rows = res.data.valueRanges[0].values;
                if (rows.length > 0) {
                    rows.forEach((row, i) => {
for(let cell in row){
    if(row[cell]){
        row[cell] = row[cell].trim();
    }
    else{
        row[cell] = '';
    }
}
                        returnData.push(
                            {
                                'nombres': row[0],
                                'apellido1': row[1],
                                'apellido2': row[2],
                                'tipoTramite': row[3],
                                'tipoDocumento': row[4],
                                'numeroDocumento': row[5],
                                'nacionalidad': row[6],
                                'caducidadTarjeta': row[7],
                                'motivo': row[8],
                                'anoNacimiento': row[9],
                                'provincia': row[10],
                                'telefono': phoneNumbers[i % 2 === 0 ? 0 : 1],
                                'email': emails[i % 2 === 0 ? 0 : 1],
                                'dataRow': i + 2,
                                'simSlot':'slot' + (i % 2 === 0 ? 0 : 1),
                                'probing': false,
                                'striking':[]
                            }
                        )
                    });
                    resolve(returnData);
                } else {
                    reject('No Data found');
                }
            });
    })
}


function updateCells(auth, ranges, newValues) {
    return new Promise((resolve, reject) => {
        const sheets = google.sheets({version: 'v4', auth});
        let resourceData = [];

        for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
            resourceData.push(
                {
                    range: 'expedientes!' + ranges[rangeIndex],
                    values: [[newValues[rangeIndex]]]
                }
            );
        }
        let resources = {
            auth: auth,
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: resourceData
            }
        };
        sheets.spreadsheets.values.batchUpdate(resources, (err, res) => {
            if (err) {
                // Handle error
                reject('cell update error:', err);
            } else {
                logger.debug('cells updated: ', res.data.totalUpdatedCells);
                resolve();
            }
        });
    })
}


module.exports = {init, populateDataMap, updateCells}
