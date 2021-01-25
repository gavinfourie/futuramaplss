// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const toexcel = require('node-excel-export');
let priceChanges = []
let oldItems = []
let newItems = []

// Visiting price list home clears all variables and renders home pricelist page
router.get('/', (req, res) => {
    priceChanges = []
    oldItems = []
    newItems = []
    res.render('pricelisthome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, (err, fields, files) => {
        let sfile = files['old-sheet'].path
        let jfile = xtj({
          sourceFile: sfile,
          columnToKey: {
            '*': '{{columnHeader}}'
          }
        })
        // Newly added
        res.send('Starting first sheet')
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            // Look for any item with a price of more than 0 (Items with a price of zero are generally discontinued)
            if (jfile[sheet][item]['Cost (ex VAT)'] > 0){
                oldItems.push(jfile[sheet][item])
            }
          }
        }
        res.redirect('/pricelists/new')
    })
})

router.get('/new', (req, res) => {
    res.render('pricelistnew')
})

// Start uploading new sheet
router.post('/new', (req, res, next) => {
  const form = new formidable.IncomingForm()

  form.parse(req, (err, fields, files) => {
      let sfile = files['new-sheet'].path
      let jfile = xtj({
        sourceFile: sfile,
        columnToKey: {
          '*': '{{columnHeader}}'
        }
      })
      // Newly added
      res.send('Starting second sheet')
      for (var sheet in jfile) {
        for (var item in jfile[sheet]) {
          if (jfile[sheet][item]['Cost (ex VAT)'] > 0){
              newItems.push(jfile[sheet][item])
          }
        }
      }
      res.redirect('/pricelists/compare')
  })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Find array without duplicates
    let finalNew = _.uniqBy(newItems, 'SKU')
    // Remove duplicates
    let newDuplicate = _.difference(newItems, finalNew)
    let finalOld = _.uniqBy(oldItems, 'SKU')
    let oldDuplicate = _.difference(oldItems, finalOld)
    let oldNumbers = []
    // Newly added
    res.send('Starting comparison')
    // Create new array without the duplicates
    for (let i = 0; i < finalOld.length; i++) {
        let itemCode = finalOld[i]['SKU']
        oldNumbers.push(itemCode)
    }
    let newNumbers = []
    for (let i = 0; i < finalNew.length; i++) {
        let itemCode = finalNew[i]['SKU']
        newNumbers.push(itemCode)
    }
    // Find items that were on the old price list, but have been removed on the new one
    let dropped = _.difference(oldNumbers, newNumbers)
    let droppedFinal = []
    for (let i = 0; i < dropped.length; i++) {
        let item = { 'SKU': dropped[i] }
        droppedFinal.push(item)
    }
    // Find items that are on the new price list, but not on the old one
    let added = _.difference(newNumbers, oldNumbers)
    let addedFinal = []
    for (let i = 0; i < added.length; i++) {
        let item = { 'SKU': added[i] }
        addedFinal.push(item)
    }
    // Find all items with pricing differences between the new and old sheet and add to an array
    for (let i = 0; i < finalOld.length; i++) {
        for (let x = 0; x < finalNew.length; x++) {
            if (finalOld[i]['SKU'] === finalNew[x]['SKU']) {
                if (finalOld[i]['Cost (ex VAT)'] !== finalNew[x]['Cost (ex VAT)']) {
                    priceChanges.push(finalNew[x])
                }
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
    };
    const specificationDA = {
        'SKU': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 120
        }
    }
    const specification = {
        'SKU': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 120
        },
        'Cost (ex VAT)': {
            displayName: 'Cost (ex VAT)',
            headerStyle: styles.headerDark,
            width: 120
        }
    }
    // Build excel file to export all data
    const sending = toexcel.buildExport(
        [
            {
                name: 'Price Changes',
                specification: specification,
                data: priceChanges
            },
            {
                name: 'Dropped',
                specification: specificationDA,
                data: droppedFinal
            },
            {
                name: 'Added',
                specification: specificationDA,
                data: addedFinal
            },
            {
              name: 'Duplicates in Old',
              specification: specificationDA,
              data: oldDuplicate
            },
            {
              name: 'Duplicates in New',
              specification: specificationDA,
              data: newDuplicate
            }
        ]
    )
    // Send to browser to start download
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router
