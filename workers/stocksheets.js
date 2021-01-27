// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const csv = require("csvtojson");
const toexcel = require('node-excel-export');
let { DateTime } = require('luxon');
let magentoInStock = []
let dearInStock = []
let dearOutStock = []
let changeToOut = []
let tempChangeToIn = []
let changeToIn = []
let specialDates = []
let expiredDates = []

// Visiting stock sheet home clears all variables and renders home stocksheet page
router.get('/', (req, res) => {
    magentoInStock = []
    dearInStock = []
    dearOutStock = []
    changeToOut = []
    changeToIn = []
    specialDates = []
    expiredDates = []
    tempChangeToIn = []
    res.render('stocksheethome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, async (err, fields, files) => {
        let sfile = files['magento-sheet'].path
        let jfile = []
        await csv().fromFile(sfile).then(async(jsonObj)=>{
            await jfile.push(jsonObj)
        })
        /*let json = csvToJson.formatValueByType().fieldDelimiter(',').getJsonFromCsv(sfile);
        for (let i=0; i<json.length;i++) {
            console.log(json[i]);
        }*/
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            if (jfile[sheet][item]['In Stock'] === 'In Stock'){
                magentoInStock.push(jfile[sheet][item])
            }
          }
        }
        res.redirect('/stocksheets/dear')
    })
})

router.get('/dear', (req, res) => {
    res.render('stocksheetdear')
})

// Start uploading new sheet
router.post('/dear', (req, res, next) => {
  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
      let sfile = files['dear-sheet'].path
      let jfile = []
      await csv().fromFile(sfile).then(async(jsonObj)=>{
        await jfile.push(jsonObj)
       })
      for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            if (jfile[sheet][item].OnHand > 0){
                dearInStock.push(jfile[sheet][item])
            } else {
                dearOutStock.push(jfile[sheet][item])
            }
          }
        }
      res.redirect('/stocksheets/compare')
  })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Find Items to change to out of stock
    for (let i = 0; i < dearOutStock.length; i++) {
        for (let x = 0; x < magentoInStock.length; x++) {
            if (dearOutStock[i].SKU === magentoInStock[x].SKU) {
                let item = { 'SKU': magentoInStock[x].SKU, 'Description': magentoInStock[x].title }
                changeToOut.push(item)
            }
        }
    }
    // Make arrays of only SKU row
    let magentoSKU = _.uniqBy(magentoInStock, 'SKU')
    let dearSKU = _.uniqBy(dearInStock, 'SKU')
    // Find array of items to make in stock
    let inStock = _.difference(dearSKU, magentoSKU)
    // Create items correctly
    for (let i = 0; i < inStock.length; i++) {
        let item = { 'SKU': inStock[i]['SKU'], 'Description': inStock[i]['ProductName'] }
        tempChangeToIn.push(item)
    }
    let changeToIn = _.uniqBy(tempChangeToIn, 'SKU')
    console.log("Length: ", changeToIn.length)
    let myDateDay = DateTime.local().day
    let myDateMonth = DateTime.local().month
    let myDateYear = DateTime.local().year
    for (var item in magentoInStock) {
        if (magentoInStock[item]['Special Price To Date']) {
            let itemFound = { 'SKU': magentoInStock[item]['SKU'],
            'Description': magentoInStock[item].title,
            'Normal Price': magentoInStock[item].Price,
            'Special Price': magentoInStock[item]['Special Price'],
            'Start Date': magentoInStock[item]['Special Price From Date'],
            'End Date': magentoInStock[item]['Special Price To Date'] }
            specialDates.push(itemFound)
        }
    }
    for (var i = 0; i < specialDates.length; i++) {
        let magentoYear = specialDates[i]['End Date'].slice(0, 4)
        magentoYear = Number(magentoYear)
        let magentoMonth = specialDates[i]['End Date'].slice(5, 7)
        magentoMonth = Number(magentoMonth)
        let magentoDay = specialDates[i]['End Date'].slice(8, 10)
        magentoDay = Number(magentoDay)
        if (magentoYear < myDateYear) {
            let itemFound = { 'SKU': specialDates[i]['SKU'],
            'Description': specialDates[i].Description,
            'Normal Price': specialDates[i]['Normal Price'],
            'Special Price': specialDates[i]['Special Price'],
            'Start Date': specialDates[i]['Start Date'],
            'End Date': specialDates[i]['End Date'] }
            expiredDates.push(itemFound)
        } else if (magentoYear <= myDateYear && magentoMonth < myDateMonth) {
            let itemFound = { 'SKU': specialDates[i]['SKU'],
            'Description': specialDates[i].Description,
            'Normal Price': specialDates[i]['Normal Price'],
            'Special Price': specialDates[i]['Special Price'],
            'Start Date': specialDates[i]['Start Date'],
            'End Date': specialDates[i]['End Date'] }
            expiredDates.push(itemFound)
        } else if (magentoYear <= myDateYear && magentoMonth <= myDateMonth && magentoDay < myDateDay) {
            let itemFound = { 'SKU': specialDates[i]['SKU'],
            'Description': specialDates[i].Description,
            'Normal Price': specialDates[i]['Normal Price'],
            'Special Price': specialDates[i]['Special Price'],
            'Start Date': specialDates[i]['Start Date'],
            'End Date': specialDates[i]['End Date'] }
            expiredDates.push(itemFound)
        }
    }
    // Creating styles for excel sheet being output
    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF000000'
                }
            },
            font: {
                color: {
                  rgb: 'FFFFFFFF'
                },
                sz: 14,
                bold: true,
                underline: true
            }
        }
    }
    const specification = {
        'SKU': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 240
        },
        'Description': {
            displayName: 'Description',
            headerStyle: styles.headerDark,
            width: 480
        }
    }
    const specificationP = {
        'SKU': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 240
        },
        'Description': {
            displayName: 'Description',
            headerStyle: styles.headerDark,
            width: 480
        },
        'Normal Price': {
            displayName: 'Normal Price',
            headerStyle: styles.headerDark,
            width: 120
        },
        'Special Price': {
            displayName: 'Special Price',
            headerStyle: styles.headerDark,
            width: 120
        },
        'Start Date': {
            displayName: 'Start Date',
            headerStyle: styles.headerDark,
            width: 160
        },
        'End Date': {
            displayName: 'End Date',
            headerStyle: styles.headerDark,
            width: 160
        }
    }
    // Build excel file to export all data
    const sending = toexcel.buildExport(
        [
            {
                name: 'Now Out Of Stock',
                specification: specification,
                data: changeToOut
            },
            {
                name: 'Now In Stock',
                specification: specification,
                data: changeToIn
            },
            {
                name: 'Special Pricing Ended',
                specification: specificationP,
                data: expiredDates
            }
        ]
    )
    // Send to browser to start download
    res.attachment('exports.xlsx')
    res.send(sending)
})

module.exports = router