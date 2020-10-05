module.exports = {
    async run(page, record, resolve, reject, pageId) {
        try {

            let btnAceptar = '#btnAceptar';
            await page.waitForSelector(btnAceptar);

            let markSelectedProcess = await page.evaluate(
                (record) => {
                    let optionsArray = document.querySelectorAll('select[class="mf-input__l"] > option');
                    for (let optionsIndex = 0; optionsIndex < optionsArray.length; optionsIndex++) {
                        let option = optionsArray[optionsIndex];
                        if (option.innerText === record.tipoTramite) {
                            option.selected = true;
                            return true;
                        } else if (optionsIndex === optionsArray.length - 1) {
                            return false
                        }
                    }


                }, record
            );

            if (markSelectedProcess) {
                await page.click(btnAceptar);
                resolve({msg: 'Stage 2 done!'});
            } else {
                reject({message: 'Selected process is not available in this province, please check your data.'});
            }

        } catch (err) {
            reject(err);
        }

    }
}
