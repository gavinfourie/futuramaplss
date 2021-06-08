// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const csv = require("csvtojson");
let csvToJson = require('convert-csv-to-json');
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
let finalExpiredDates = []
let schalkIn = []
let removals = []

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
    finalExpiredDates = []
    schalkIn = []
    removals = []
    res.render('stocksheethome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, async (err, fields, files) => {
        let sfile = files['magento-sheet'].path
        // let jfile = []
        /**await csv().fromFile(sfile).then(async(jsonObj)=>{
            await jfile.push(jsonObj)
        })**/
        let tempMagentoInStock = []
        let jfile = await csv({
            delimiter: ';',
            ignoreEmpty: true,
        }).fromFile(sfile).then((jsonObj)=>{
            tempMagentoInStock.push(jsonObj)
        })
        // jfile = csvToJson.getJsonFromCsv(sfile)
        /*let json = csvToJson.formatValueByType().fieldDelimiter(',').getJsonFromCsv(sfile);
        for (let i=0; i<json.length;i++) {
            console.log(json[i]);
        }*/
        /*for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            if (jfile[sheet][item]) {
                magentoInStock.push(jfile[sheet][item])
                //console.log('mageInStock', magentoInStock)
            }
          }
        }*/
        for (var sheet in tempMagentoInStock) {
            for (var item in tempMagentoInStock[sheet]) {
                magentoInStock.push(tempMagentoInStock[sheet][item])
            }
        }
        res.redirect('/stocksheets/choice')
    })
})

router.get('/choice', (req, res) => {
    res.render('choice')
})

router.get('/dear', (req, res) => {
    res.render('stocksheetdear')
})

router.get('/dylan', (req, res) => {
    res.render('stocksheetdylan')
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
            if (jfile[sheet][item].Available > 0){
                dearInStock.push(jfile[sheet][item])
            } else {
                dearOutStock.push(jfile[sheet][item])
            }
          }
        }
        console.log("dear", dearOutStock)
      res.redirect('/stocksheets/removals')
  })
})

router.get('/removals', (req, res) => {
    res.render('removals')
})

router.post('/removals', (req, res, next) => {
  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
      let sfile = files['removals-sheet'].path
      let jfile = []
      await csv().fromFile(sfile).then(async(jsonObj)=>{
        await jfile.push(jsonObj)
       })
      for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            removals.push(jfile[sheet][item])
          }
        }
      res.redirect('/stocksheets/compare')
  })
})

// Start uploading new sheet
router.post('/dylan', (req, res, next) => {
  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
      let sfile = files['dylan-sheet'].path
      let jfile = xtj({
        sourceFile: sfile,
        columnToKey: {
            '*': '{{columnHeader}}'
        }
        })
      for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            if (jfile[sheet][item].SOH > 0 && jfile[sheet][item]['Product Name'].length > 1) {
                dearInStock.push(jfile[sheet][item])
            } else if (jfile[sheet][item].SOH <= 0 && jfile[sheet][item].SKU.length > 1) {
                dearOutStock.push(jfile[sheet][item])
            }
          }
        }
      res.redirect('/stocksheets/compare')
  })
})

router.get('/schalk', (req, res) => {
    res.render('schalk')
})

router.post('/schalk', (req, res, next) => {
    const form = new formidable.IncomingForm()

    form.parse(req, async (err, fields, files) => {
        let sfile = files['schalk-sheet'].path
        let jfile = xtj({
            sourceFile: sfile,
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        })
        for (var sheet in jfile) {
            for (var item in jfile[sheet]) {
                if (jfile[sheet][item].Quantity > 0){
                    schalkIn.push(jfile[sheet][item])
                }
            }
        }
        res.redirect('/stocksheets/compare')
    })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Find Items to change to out of stock
    /**for (let i = 0; i < dearOutStock.length; i++) {
        for (let x = 0; x < magentoInStock.length; x++) {
            if (dearOutStock[i].SKU === magentoInStock[x].SKU) {
                let item = { 'SKU': magentoInStock[x].SKU, 'Description': magentoInStock[x].title }
                changeToOut.push(item)
            }
        }
    }**/
    console.log("Dear Out", dearOutStock)
    let tempChangeToOut = _.intersectionBy(dearOutStock, magentoInStock, 'SKU')
    console.log("Temp Out", tempChangeToOut)
    for (let i = 0; i < tempChangeToOut.length; i++) {
        if (tempChangeToOut[i].title) {
            let item = { 'SKU': tempChangeToOut[i]['SKU'], 'Description': tempChangeToOut[i].title }
            changeToOut.push(item)
        } else if (tempChangeToOut[i]['Product Name']) {
            let item = { 'SKU': tempChangeToOut[i]['SKU'], 'Description': tempChangeToOut[i]['Product Name'] }
            changeToOut.push(item)
        }
        //let item = { 'SKU': tempChangeToOut[i].SKU, 'Description': tempChangeToOut[i].title }
        //changeToOut.push(item)
    }
    let finalOut = _.uniqBy(changeToOut, 'SKU')
    // Make arrays of no duplicates
    let magentoSKU = _.uniqBy(magentoInStock, 'SKU')
    let dearSKU = _.uniqBy(dearInStock, 'SKU')
    // Find array of items to make in stock
    let tempInStock = _.differenceBy(dearSKU, magentoSKU, 'SKU')
    let inStock = _.pullAllBy(tempInStock, magentoSKU, 'SKU')
    // let inStock = _.differenceBy(inStockPre, removals, 'SKU')
    // Create items correctly
    /**for (let i = 0; i < schalkIn.length; i++) {
        for (let x = 0; x < inStock.length; x++) {
            if (schalkIn[i].SKU === inStock[x].SKU) {
                if (inStock[x].Available) {
                    inStock[x].Available = inStock[x].Available - schalkIn[i].Quantity
                } else {
                    inStock[x].SOH = inStock[x].SOH - schalkIn[i].Quantity
                }
            }
        }
    }**/
    for (let i = 0; i < inStock.length; i++) {
        if (inStock[i].Available > 0 || inStock[i].SOH > 0) {
            if (inStock[i].title) {
                let item = { 'SKU': inStock[i]['SKU'], 'Description': inStock[i].title }
                tempChangeToIn.push(item)
            } else if (inStock[i]['Product Name']) {
                let item = { 'SKU': inStock[i]['SKU'], 'Description': inStock[i]['Product Name'] }
                tempChangeToIn.push(item)
            }
        }
    }
    changeToIn = _.uniqBy(tempChangeToIn, 'SKU')
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
    finalExpiredDates = _.uniqBy(expiredDates, 'SKU')
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
                data: finalOut
            },
            {
                name: 'Now In Stock',
                specification: specification,
                data: changeToIn
            },
            {
                name: 'Special Pricing Ended',
                specification: specificationP,
                data: finalExpiredDates
            }
        ]
    )
    // Send to browser to start download
    res.attachment('exports.xlsx')
    res.send(sending)
})

module.exports = router