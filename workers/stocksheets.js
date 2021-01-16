// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const toexcel = require('node-excel-export');
let magentoInStock = []
let dearInStock = []
let dearOutStock = []
let changeToOut = []

// Visiting stock sheet home clears all variables and renders home stocksheet page
router.get('/', (req, res) => {
    magentoInStock = []
    dearInStock = []
    dearOutStock = []
    changeToOut = []
    res.render('stocksheethome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, (err, fields, files) => {
        let sfile = files['magento-sheet'].path
        let jfile = xtj({
          sourceFile: sfile,
          columnToKey: {
            '*': '{{columnHeader}}'
          }
        })
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            // Read all in stock items from Magento into an Array
            if (jfile[sheet][item]['In Stock'] === 'In Stock'){
                magentoInStock.push(jfile[sheet][item])
                console.log('Magento in stock')
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

  form.parse(req, (err, fields, files) => {
      let sfile = files['dear-sheet'].path
      let jfile = xtj({
        sourceFile: sfile,
        columnToKey: {
          '*': '{{columnHeader}}'
        }
      })
      for (var sheet in jfile) {
        for (var item in jfile[sheet]) {
            // Find all items in stock in store and put in array
            if (jfile[sheet][item].OnHand > 0){
                dearInStock.push(jfile[sheet][item])
                console.log("dear in stock")
            } else {
                dearOutStock.push(jfile[sheet][item])
                console.log("dear no stock")
            }
        }
      }
      res.redirect('/stocksheets/compare')
  })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Pull just SKU's from Arrays
    console.log("Compare called")
    let magentoSKU = []
    for (let i = 0; i < magentoInStock.length; i++) {
        let item = { 'SKU': magentoInStock[i].SKU }
        magentoSKU.push(item)
        console.log(magentoInStock[i].SKU)
    }
    let dearInSKU = []
    for (let i = 0; i < dearInStock.length; i++) {
        let item = { 'SKU': dearInStock[i].SKU }
        dearInSKU.push(item)
    }
    let dearOutSKU = []
    for (let i = 0; i < dearOutStock.length; i++) {
        let item = { 'SKU': dearOutStock[i].SKU }
        dearOutSKU.push(item)
    }
    // Find Items to change to out of stock
    for (let i = 0; i < dearOutSKU.length; i++) {
        for (let x = 0; x < magentoSKU.length; x++) {
            if (dearOutSKU[i] === magentoSKU[x]) {
                changeToOut.push(magentoSKU[x])
                console.log("Change something to out")
            }
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
            }
        ]
    )
    // Send to browser to start download
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router