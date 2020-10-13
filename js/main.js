//Puppeteer and plugins
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//Cron
const CronJob = require('cron').CronJob;
const job = new CronJob('00 00 6 * * *', function () {
    console.log('Cron job starting app!');
    start();
}, null, true, 'Europe/Madrid');
job.start();

//Express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
const port = 3000;
app.use('/healthcheck', require('express-healthcheck')());

//Utils
const {v4: uuidv4} = require('uuid');
const path = require('path');
global.simSlots = {
    'slot0': {locked: false, phoneNumber: '644354712', smsCode: null},
    'slot1': {locked: false, phoneNumber: '644378714', smsCode: null}
};
const utils = require('./utils');

//Logging
const log4js = require("log4js");
log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[%d %p%] %f:%l %m'
            }
        },
        file: {
            type: 'file',
            filename: path.join(__dirname, '../logs/application.log'),
            maxLogSize: 2097152,
            backups: 3,
            compress: true,
            layout: {
                type: 'pattern',
                pattern: '* %p %d{yyyy/MM/dd-hh.mm.ss} %f:%l %m'
            }
        }

    },
    categories: {
        default: {appenders: ['console', 'file'], level: 'debug', enableCallStack: true}
    }
});
global.logger = log4js.getLogger();
logger.level = 'debug';


//Application modules
const pageMaker = require('./pageMaker');
const getData = require('./getData');

//Routes
app.get('/', (req, res) => {
    res.send('Silb.io, Stand In Line Bot');
    logger.info('Home page hit!');
})


app.get('/start', (req, res) => {
    if (req.query.password === "kabalahMacarena") {
        logger.info('Silb started remotely.')
        res.send('Starting SILB');
        start();
    } else {
        res.sendStatus(401);
    }
})

app.get('/stop', (req, res) => {
    if (req.query.password === "kabalahMacarena") {
        logger.info('Silb stopped remotely.')
        res.send('Stopping SILB');
        stop();
    } else {
        res.sendStatus(401);
    }
})

app.post('/sms', (req, res) => {

    let body = req.body;
    logger.debug('SMS received with text: ' + JSON.stringify(req.body));
    if (body.secret === 'whowillqueueforyou?') {
        res.sendStatus(200);
        let message = body.message;
        let simSlot = 'slot' + body.slot;
        simSlots[simSlot].smsCode = message.replace(/[A-Za-z\s:,]/g, '');

    } else {
        res.sendStatus(401);
    }

});

app.listen(port, () => {
    logger.info(`SILB listening at http://localhost:${port}`);
});

logger.debug('---------------------------- Application Initialized ----------------------------');


start();

//Get Initial data
function start() {
    let auth;
    new Promise((resolve, reject) => {
        getData.init()
            .then((authToken) => {
                logger.info('Data initialized correctly');
                auth = authToken;
                getData.populateDataMap(auth).then((data) => {
                    logger.debug(JSON.stringify(data));
                    resolve(data);
                })
            })
            .catch((err) => {
                reject(err);
            });
    }).then(async (records) => {

        global.browser = await puppeteer.launch({headless: process.env.NODE_ENV !== 'development'});
        global.userAgent = await browser.userAgent();
        global.pages = {};
        let probingProvincesProcesses = [];
        let probingData = [];
        let strikingData = {};

        records.forEach((record) => {
            let processNumber = utils.getProcessEnumOrName(record.tipoTramite)
            let combinedName = `${record.provincia} - ${processNumber}`;
            if (probingProvincesProcesses.includes(combinedName)) {
                if (strikingData.hasOwnProperty(combinedName)) {
                    strikingData[combinedName].push(record)
                } else {
                    strikingData[combinedName] = [record]
                }
            } else {
                probingProvincesProcesses.push(combinedName);
                record.probing = combinedName;
                probingData.push(record);
            }
        });
        for (let i = 0; i < probingData.length; i++) {
            probingData[i].striking = strikingData[probingData[i].probing] || [];
            logger.info('Probing data for province/process combo ' + probingData[i].probing + '. It has ' + probingData[i].striking.length + ' strike records.')
            await makePages(probingData[i], null);
        }
    }).catch((error) => {
        logger.error(error);
    });
}

function stop() {
    browser.close()
}

//Takes in pageId if possible (to maintain the same person with the same ID).
async function makePages(record, pageId) {

    pageId = pageId || await uuidv4();
    let context = await browser.createIncognitoBrowserContext();
    let page = await context.newPage();
    pages[pageId] = {page: page};

    logger.info('pageId ' + pageId + ' assigned to ' + record.nombres);
    new Promise((resolve, reject) => {


        pageMaker.make(pageId, record, resolve, reject);
    })
        .then((resolution) => {

            if (resolution.msg === 'success') {
                // TODO => Create user DB with records and credits, and the module to handle them. At this point, mark PPI for deletion from DB after a quarantine.
                logger.info('!!!!!!!!!!' + record.numeroDocumento + ' successfully finished!!!!!!!!!!');
                let strikingData = resolution.strikingData || [];
                for (let k = 0; k < strikingData.length; k++) {
                    logger.info('Probing successful, starting with strike data: ' + JSON.stringify(strikingData[k]));
                    makePages(strikingData[k], null);
                }
            }
        }).catch(err => {

        if (err.reset) {
            logger.warn(pageId + ' reset' + (err.name === 'TimeoutError' ? ' due to a page timeout.' : ' due to error: ' + err.message + '.'))
            makePages(record, pageId);
        } else {
            logger.error(err);
        }
    });


}
