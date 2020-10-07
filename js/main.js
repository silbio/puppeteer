//Puppeteer and plugins
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//Utils
const {v4: uuidv4} = require('uuid');
const path = require('path');
const utils = require('./utils');

//Cron
const CronJob = require('cron').CronJob;
const job = new CronJob('00 00 6 * * *', function() {
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
logger.debug('Logger ready!');


//Application modules
const pageMaker = require('./pageMaker');
const getData = require('./getData');
const coordinator = require('./coordinator')


//Routes
app.get('/', (req, res) => {
    res.send('Silb.io, Stand In Line Bot');
    logger.info('Home page hit!');
})

app.get('/start', (req,res)=>{
    if(req.query.password === "kabalahMacarena") {
        logger.info('Silb started remotely.')
        res.send('Starting SILB');
        start();
    }
    else{
        res.sendStatus(401);
    }
})

app.post('/sms', (req, res) => {

    let body = req.body;
    logger.debug('SMS received with text: ' + (JSON.stringify(body)));
    if (body.secret === 'whowillqueueforyou?') {
        res.json({"payload": {"success": true}});
        let message = body.message;
        let sender = body.from;
        let timestamp = body.sent_timestamp;
        let smsCode = message.replace(/[A-Za-z\s:,]/g, '');
        coordinator.addSmsCode(smsCode, sender, timestamp);

    }

});

app.listen(port, () => {
    logger.info(`SILB listening at http://localhost:${port}`);
});

logger.info('Application starting!')
let auth;


//Get Initial data

function start(){
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
        let hittingData = {};

        records.forEach((record) => {
            let processNumber = utils.getProcessEnumOrName(record.tipoTramite)
            let combinedName = `${record.provincia} - ${processNumber}`;
            if (probingProvincesProcesses.includes(combinedName)) {
                if (hittingData.hasOwnProperty(combinedName)) {
                    hittingData[combinedName].push(record)
                } else {
                    hittingData[combinedName] = [record]
                }
            } else {
                probingProvincesProcesses.push(combinedName);
                probingData.push(record);
            }
        });

        await makePages(records);

    }).catch((error) => {
        logger.error(error);
    });
}

async function makePages(recordsForPages) {
    for (let i = 0; i < recordsForPages.length; i++) {
        let record = recordsForPages[i];
        let pageId = await uuidv4();
        let context = await browser.createIncognitoBrowserContext();
        let page = await context.newPage();
        pages[pageId] = {page: page};

        logger.info('pageId ' + pageId + ' assigned to ' + record.nombres);
        new Promise((resolve, reject) => {
            coordinator.addPageId(pageId, record.telefono);

            pageMaker.make(pageId, record, resolve, reject);
        })
            .then(async (resolution) => {

                if (resolution === 'success') {
                    // TODO => Create user DB with records and credits, and the module to handle them. At this point, mark PPI for deletion from DB after a quarantine.
                    logger.info('!!!!!!!!!!' + record.numeroDocumento + ' successfully finished!!!!!!!!!!');

                }
            }).catch(err => {

            if (err.reset) {
                logger.warn(pageId + ' reset' + (err.name === 'TimeoutError' ?' due to a page timeout.' : 'Due to error: ' + err.message + '.'))
                makePages([record]);
            } else {
                logger.error(err);
            }
        });
    }


}
