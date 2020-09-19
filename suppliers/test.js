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
    let finalNew = _.uniqBy(newItems, 'SKU')
    let newDuplicate = _.difference(newItems, finalNew)
    let finalOld = _.uniqBy(oldItems, 'SKU')
    let oldDuplicate = _.difference(oldItems, finalOld)
    let oldNumbers = []
    for (let i = 0; i < finalOld.length; i++) {
        let itemCode = finalOld[i]['SKU']
        oldNumbers.push(itemCode)
    }
    let newNumbers = []
    for (let i = 0; i < finalNew.length; i++) {
        let itemCode = finalNew[i]['SKU']
        newNumbers.push(itemCode)
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
    for (let i = 0; i < finalOld.length; i++) {
        for (let x = 0; x < finalNew.length; x++) {
            if (finalOld[i]['SKU'] === finalNew[x]['SKU']) {
                if (finalOld[i]['Cost (ex VAT)'] !== finalNew[x]['Cost (ex VAT)']) {
                    priceChanges.push(finalNew[x])
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
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router
