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
let changeToIn = []
let specialDates = []

// Visiting stock sheet home clears all variables and renders home stocksheet page
router.get('/', (req, res) => {
    magentoInStock = []
    dearInStock = []
    dearOutStock = []
    changeToOut = []
    changeToIn = []
    specialDates = []
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
                let item = { 'SKU': magentoInStock[x].SKU }
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
        let item = { 'SKU': inStock[i]['SKU'] }
        changeToIn.push(item)
    }
    let myDateDay = DateTime.local().day
    let myDateMonth = DateTime.local().month
    let myDateYear = DateTime.local().year
    for (var item in magentoInStock) {
        if (magentoInStock[item]['Special Price']) {
            let itemFound = { 'SKU': magentoInStock[item]['SKU'], 
            'Date': magentoInStock[item]['Special Price To Date'] }
            specialDates.push(itemFound)
        }
    }
    for (var i = 0; i < specialDates.length; i++) {
        let magentoYear = specialDates[i]['Date'].slice(0, 4)
        let magentoMonth = specialDates[i]['Date'].slice(5, 7)
        magentoMonth = parseInt(magentoMonth)
        console.log(magentoMonth)
        let magentoDay = specialDates[i]['Date'].slice(8, 10)
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
            width: 120
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
            }
        ]
    )
    // Send to browser to start download
    res.attachment('exports.xlsx')
    res.send(sending)
})

module.exports = router