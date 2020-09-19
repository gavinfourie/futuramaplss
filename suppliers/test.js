const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const toexcel = require('node-excel-export');
let priceChanges = []
let oldItems = []
let newItems = []

router.get('/', (req, res) => {
    priceChanges = []
    oldItems = []
    newItems = []
    res.render('indext')
})

router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()

    form.parse(req, (err, fields, files) => {
        let sfile = files['old-sheet'].path
        let jfile = xtj({
          sourceFile: sfile,
          columnToKey: {
            '*': '{{columnHeader}}'
          }
        })
        for (var sheet in jfile) {
          for (var item in jfile[sheet]) {
            if (jfile[sheet][item]['Cost (ex VAT)'] > 0){
                oldItems.push(jfile[sheet][item])
            }
          }
        }
        res.redirect('/test/new')
    })
})

router.get('/new', (req, res) => {
    res.render('indexgnt')
})

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
      for (var sheet in jfile) {
        for (var item in jfile[sheet]) {
          if (jfile[sheet][item]['Cost (ex VAT)'] > 0){
              newItems.push(jfile[sheet][item])
          }
        }
      }
      res.redirect('/test/compare')
  })
})

router.get('/compare', (req, res) => {
    let duplicates = []
    let oldNumbers = []
    for (let i = 0; i < oldItems.length; i++) {
        let itemCode = oldItems[i]['SKU']
        for (let ii = 0; ii < oldNumbers.length; ii++) {
          if (oldItems[i]['SKU'] === oldNumbers[ii]) {
            duplicates.push(itemCode)
          } else {
            oldNumbers.push(itemCode)
          }
        }
    }
    let newNumbers = []
    for (let i = 0; i < newItems.length; i++) {
        let itemCode = newItems[i]['SKU']
        for (let ii = 0; ii < newNumbers.length; ii++) {
          if (newItems[i]['SKU'] === newNumbers[ii]) {
            duplicates.push(itemCode)
          } else {
            newNumbers.push(itemCode)
          }
        }
    }
    let dropped = _.difference(oldNumbers, newNumbers)
    let droppedFinal = []
    for (let i = 0; i < dropped.length; i++) {
        let item = { 'SKU': dropped[i] }
        droppedFinal.push(item)
    }
    let added = _.difference(newNumbers, oldNumbers)
    let addedFinal = []
    for (let i = 0; i < added.length; i++) {
        let item = { 'SKU': added[i] }
        addedFinal.push(item)
    }
    for (let i = 0; i < oldItems.length; i++) {
        for (let x = 0; x < newItems.length; x++) {
            if (oldItems[i]['SKU'] === newItems[x]['SKU']) {
                if (oldItems[i]['Cost (ex VAT)'] !== newItems[x]['Cost (ex VAT)']) {
                    priceChanges.push(newItems[x])
                }
            }
        }
    }
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
              name: 'Duplicates',
              specification: specificationDA,
              data: duplicates
            }
        ]
    )
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router
