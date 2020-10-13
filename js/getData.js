const {google} = require('googleapis');
let privateKey = require("../res/privateKey.json");
const spreadsheetId = '1LhpqxpRBJeE2ywUZtnkXyLuv74j3yKrM53VAxwDCUSA';
const phoneNumbers = [simSlots.slot0.phoneNumber, simSlots.slot1.phoneNumber]
const emails = ['turnmaker@silb.io', 'turnos@silb.io']


function init() {
    //TODO => Set up listeners to listen for new data and adding it to the probing/hitting systems.
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

                        returnData.push(
                            {
                                'nombres': row[0],
                                'apellido1': row[1],
                                'apellido2': row[2],
                                'provincia': row[3],
                                'tipoTramite': row[4],
                                'tipoDocumento': row[5],
                                'numeroDocumento': row[6],
                                'nacionalidad': row[7],
                                'caducidadTarjeta': row[8],
                                'telefono': phoneNumbers[i % 2 === 0 ? 0 : 1],
                                'email': emails[i % 2 === 0 ? 0 : 1],
                                'motivo': row[10],
                                'anoNacimiento': row[11],
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
