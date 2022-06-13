const puppeteer = require('puppeteer')


const options = {
    headless: true,
    args: [
        '--lang=en',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas'
    ]
}

let updatedInfo = ''

const agreeeSelector = 'body > div.disclaimer > div > div.inner-buttons > button.agree'
const updatesSelector = '#map > div.leaflet-control-container > div.leaflet-bottom.leaflet-right > div.history.custom-control.leaflet-control > span'
const historySelector = 'body > div.dialog-mask > div > div.dialog-content > ul > li > div.history__description'
const closeHistorySelector = 'body > div.dialog-mask > div > div.deep-header > div'


const closeWidget = (page) => new Promise(async (res,rej) => {
    try {
        await page.waitForTimeout(1000)
        await page.evaluate(() => {
            let widgetSelector = '#getsitecontrol-243541'
            let widget = document.querySelector(widgetSelector)
            if (widget){
                widget.remove()
            }
        })
        res()
    } catch (err){
        console.log(err)
        rej(err)
    }
})




const removeHud = (page) => new Promise(async (res,rej) => {
    try {
        await page.waitForSelector('#map > div.leaflet-control-container > div.leaflet-top.leaflet-right')
        await page.evaluate(() => {
            const hudSelectors = [
                '#map > div.leaflet-control-container > div.leaflet-top.leaflet-right',
                'body > div.search-container',
                '#map > div.leaflet-control-container > div.leaflet-bottom.leaflet-right > div.leaflet-control-zoom.leaflet-bar.leaflet-control',
                '#icon-control > div',
                '#map > div.leaflet-control-container > div.leaflet-bottom.leaflet-right > div.leaflet-bar.custom-control.leaflet-control > div'
            ]
            
            for (let selector of hudSelectors){
                const element = document.querySelector(selector)
                if (element){
                    element.remove()
                }

            }
        
        })
        res()
    } catch (err){
        console.log(err)
        rej(err)
    }
})


module.exports = {
    update: () => new Promise(async (res,rej) => {
        try {
            const browser = await puppeteer.launch(options)
            let page = await browser.newPage()
            await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
            await page.goto('https://deepstatemap.live/#7/48.356/35.881',{ waitUntil: 'load' })
            await page.click(agreeeSelector)
            await page.waitForTimeout(300)
            await page.screenshot({
                path: 'map.png'
            })
            await page.waitForTimeout(1000)
            await page.waitForSelector(updatesSelector)
            await page.click(updatesSelector)
            await page.waitForSelector(historySelector)
            const history = await page.$(historySelector)
            updatedInfo = await history.evaluate(() => {
                const historySelector = 'body > div.dialog-mask > div > div.dialog-content > ul > li > div.history__description'
                const history = document.querySelector(historySelector)
                return history.innerText
            })
            const urls = await history.evaluate(() => {
                const urls = []
                const placeSelector = 'body > div.dialog-mask > div > div.dialog-content > ul > li > div.history__description > a'
                let places = document.querySelectorAll(placeSelector)
                places = places.forEach((place) => {
                    urls.push(place.href)
                })
                return urls
            })
            
            await page.waitForSelector(closeHistorySelector)
            await page.waitForTimeout(1000)
            await page.click(closeHistorySelector)
            let index = 0
            for(let url of urls){
                index++
                page = await browser.newPage()
                await page.goto(url,{ waitUntil: 'load'})
                await removeHud(page)
                if (await page.$('#getsitecontrol-243541')){
                    await closeWidget(page)
                }
                await page.waitForTimeout(4000)
                await page.screenshot({
                    path: `changes/change${index}.png`
                })
                if (index+1 === urls.length){
                    await browser.close()
                }
            }
            res(updatedInfo)
        } catch (err){
            rej(err)
            console.log(err)
        }
    }),
    checkUpdates: () => new Promise(async (res,rej) => {
        try {
            const browser = await puppeteer.launch(options)
            const page = await browser.newPage()
            await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
            await page.goto('https://deepstatemap.live/#7/48.356/35.881',{ waitUntil: 'load' })
            await page.click(agreeeSelector)
            await page.click(updatesSelector)
            await page.waitForSelector(historySelector)
            const history = await page.$(historySelector)
            const newInfo = await history.evaluate(() => {
                const historySelector = 'body > div.dialog-mask > div > div.dialog-content > ul > li > div.history__description'
                const history = document.querySelector(historySelector)
                return history.innerText
            })
            await browser.close()
            if (newInfo !== updatedInfo){
                updatedInfo = newInfo
                res(true)
            }
            res(false)
        } catch (err) {
            console.log(err)
            rej(err)
        }
    })
}

module.exports.update()
