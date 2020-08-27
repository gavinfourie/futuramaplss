const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const excel = require('xlsx-to-json-lc');
const toexcel = require('node-excel-export');
const _ = require('lodash');
let OldSheet
let NewSheet
let priceChanges = []
let newItems = []

router.get('/', (req, res) => {
    res.render('indexg')
})

router.post('/', (req, res, next) => {
    const form = formidable({ multiples: true })
    let newFile = null
    let jsonRes = null

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err)
            return
        }
    })
    form.on('file', (name, file) => {
        newFile = file.path
        excel({
            input: newFile,
            output: jsonRes,
            lowerCaseHeaders: true
        }, function(err, result) {
            if (err) {
                console.log(err)
            } else {
                OldSheet = result
                res.redirect('/main/new')
            }
        })
    })
})

router.get('/new', (req, res) => {
    res.render('indexgn')
})

router.post('/new', (req, res, next) => {
    const form = formidable({ multiples: true })
    let newFile = null
    let jsonRes = null

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err)
            return
        }
    })
    form.on('file', (name, file) => {
        newFile = file.path
        excel({
            input: newFile,
            output: jsonRes,
            lowerCaseHeaders: true
        }, function(err, result) {
            if (err) {
                console.log(err)
            } else {
                NewSheet = result
                res.redirect('/main/compare')
            }
        })
    })
})

router.get('/compare', (req, res) => {
    let oldNumbers = []
    for (let i = 0; i < OldSheet.length; i++) {
        let itemCode = OldSheet[i]['sku']
        oldNumbers.push(itemCode)
    }
    let newNumbers = []
    for (let i = 0; i < NewSheet.length; i++) {
        let itemCode = NewSheet[i]['sku']
        newNumbers.push(itemCode)
    }
    const dropped = _.difference(oldNumbers, newNumbers)
    const droppedFinal = []
    for (let i = 0; i < dropped.length; i++) {
        let item = { 'sku': dropped[i] }
        droppedFinal.push(item)
    }
    const added = _.difference(newNumbers, oldNumbers)
    const addedFinal = []
    for (let i = 0; i < added.length; i++) {
        let item = { 'sku': added[i] }
        addedFinal.push(item)
    }
    for (let i = 0; i < OldSheet.length; i++) {
        for (let x = 0; x < NewSheet.length; x++) {
            if (OldSheet[i]['sku'] === NewSheet[x]['sku']) {
                if (OldSheet[i]['cost ex vat'] !== NewSheet[x]['cost ex vat']) {
                    priceChanges.push(NewSheet[x])
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
        'sku': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 120
        }
    }
    const specification = {
        'sku': {
            displayName: 'SKU',
            headerStyle: styles.headerDark,
            width: 120
        },
        'cost ex vat': {
            displayName: 'Cost ex VAT',
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
                data:droppedFinal
            },
            {
                name: 'Added',
                specification: specificationDA,
                data: addedFinal
            }
        ]
    )
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router