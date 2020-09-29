const {google} = require('googleapis');
let privateKey = require("../res/privateKey.json");
const spreadsheetId = '1LhpqxpRBJeE2ywUZtnkXyLuv74j3yKrM53VAxwDCUSA';

function init() {
    return new Promise((resolve, reject) => {
if(process.env.NODE_ENV){
    resolve('1');
}
        else{ // configure a JWT auth client
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
        }
    });
}

function populateDataMap(auth) {
    return new Promise((resolve, reject) => {
        if(process.env.NODE_ENV) {
        let values = {
            "records": [{
                "nombres": "Oren",
                "apellido1": "Gan",
                "apellido2": "",
                "provincia": "Cáceres",
                "tipoTramite": "SOLICITUD DE AUTORIZACIONES",
                "tipoDocumento": "N.I.E.",
                "numeroDocumento": "Y2463972L",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "22/09/2020",
                "telefono": "655440022",
                "email": "admin@example.com",
                "motivo": "Consultas",
                "anoNacimiento":"1977",
                "status": "sin comenzar",
                "dataRow": 2
            }, {
                "nombres": "Eyal",
                "apellido1": "Dassa",
                "apellido2": "",
                "provincia": "Barcelona",
                "tipoTramite": "POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN",
                "tipoDocumento": "PASAPORTE",
                "numeroDocumento": "32191866",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "",
                "telefono": "653450018",
                "email": "rfarchi@gmail.com",
                "motivo": "", "anoNacimiento":"",
                "status": "sin comenzar",
                "dataRow": 3
            }, {
                "nombres": "Ofir",
                "apellido1": "Dassa",
                "apellido2": "",
                "provincia": "Barcelona",
                "tipoTramite": "POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN",
                "tipoDocumento": "PASAPORTE",
                "numeroDocumento": "32235673",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "",
                "telefono": "653450018",
                "email": "rfarchi@gmail.com",
                "motivo": "", "anoNacimiento":"",
                "status": "sin comenzar",
                "dataRow": 4
            }, {
                "nombres": "Maayan",
                "apellido1": "Mor",
                "apellido2": "",
                "provincia": "Barcelona",
                "tipoTramite": "POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN",
                "tipoDocumento": "N.I.E.",
                "numeroDocumento": "Y7395816L",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "",
                "telefono": "653450018",
                "email": "rfarchi@gmail.com",
                "motivo": "", "anoNacimiento":"",
                "status": "sin comenzar",
                "dataRow": 5
            }, {
                "nombres": "Maya Sarah",
                "apellido1": "Rozen",
                "apellido2": "",
                "provincia": "Barcelona",
                "tipoTramite": "POLICIA-CERTIFICADOS Y ASIGNACION NIE",
                "tipoDocumento": "PASAPORTE",
                "numeroDocumento": "ER155913",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "",
                "telefono": "653450018",
                "email": "rfarchi@gmail.com",
                "motivo": "", "anoNacimiento":"",
                "status": "sin comenzar",
                "dataRow": 6
            }, {
                "nombres": "Elad",
                "apellido1": "Tzuberi",
                "apellido2": "",
                "provincia": "Barcelona",
                "tipoTramite": "POLICIA - RECOGIDA DE TARJETA DE IDENTIDAD DE EXTRANJERO (TIE)",
                "tipoDocumento": "N.I.E.",
                "numeroDocumento": "Y4515184E",
                "nacionalidad": "ISRAEL",
                "caducidadTarjeta": "",
                "telefono": "653450018",
                "email": "rfarchi@gmail.com",
                "motivo": "", "anoNacimiento":"",
                "status": "sin comenzar",
                "dataRow": 7
            }], "interval": 5
        }

resolve(values);
        }
        else {

            //Get proceeding data from sheet
            let returnData = {records: [], interval: 30};
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

                        returnData.records.push(
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
                                'telefono': row[9],
                                'email': row[10],
                                'motivo': row[11],
                                'status': row[12].toLowerCase(),
                                'dataRow': i + 2
                            }
                        )
                    });
                    returnData.interval = parseInt(res.data.valueRanges[1].values[0]);
                    resolve(returnData);
                } else {
                    reject('No Data found');
                }
            });
        }
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
                console.log('cells updated: ', res.data.totalUpdatedCells);
                resolve();
            }
        });
    })
}


module.exports = {init, populateDataMap, updateCells}
