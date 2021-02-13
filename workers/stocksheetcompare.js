// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const toexcel = require('node-excel-export');
let uploadedSheet = []

// Visiting stock sheet home clears all variables and renders home stocksheet page
router.get('/', (req, res) => {
    uploadedSheet = []
    res.render('stocksheetcomparehome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, async (err, fields, files) => {
        let sfile = files['first-sheet'].path
        let jfile = xtj({
            sourceFile: sfile,
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        })
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            uploadedSheet.push(jfile[sheet][item])
          }
        }
        res.redirect('/stocksheetcompare/second')
    })
})

router.get('/second', (req, res) => {
    res.render('secondsheet')
})

// Start uploading new sheet
router.post('/second', (req, res, next) => {
  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
        let sfile = files['second-sheet'].path
        let jfile = xtj({
            sourceFile: sfile,
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        })
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            uploadedSheet.push(jfile[sheet][item])
          }
        }
        res.redirect('/stocksheetcompare/compare')
  })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Make arrays of no duplicates
    let outputSheet = _.uniqBy(uploadedSheet, 'SKU')
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
    // Build excel file to export all data
    const sending = toexcel.buildExport(
        [
            {
                name: 'Duplicates Removed',
                specification: specification,
                data: outputSheet
            }
        ]
    )
    // Send to browser to start download
    res.attachment('duplicateRemoval.xlsx')
    res.send(sending)
})

module.exports = router