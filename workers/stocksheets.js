// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const csv = require("csvtojson");
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
    form.parse(req, async (err, fields, files) => {
        let sfile = files['magento-sheet'].path
        let jfile = []
        await csv().fromFile(sfile).then((jsonObj)=>{
            jfile.push(jsonObj)
        })
        /*let json = csvToJson.formatValueByType().fieldDelimiter(',').getJsonFromCsv(sfile);
        for (let i=0; i<json.length;i++) {
            console.log(json[i]);
        }*/
        console.log(jfile)
        for (var item in jfile) {
            // Read all in stock items from Magento into an Array
            if (jfile[item]['In Stock'] === 'In Stock'){
                magentoInStock.push(jfile[item])
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
      await csv().fromFile(sfile).then((jsonObj)=>{
        jfile.push(jsonObj)
       })
      for (var item in jfile) {
        // Find all items in stock in store and put in array
        if (jfile[item].OnHand > 0){
            dearInStock.push(jfile[item])
        } else {
            dearOutStock.push(jfile[item])
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
    res.attachment('exports.xlsx')
    res.send(sending)
})

module.exports = router