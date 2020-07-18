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
                res.redirect('/liteoptec/new')
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
                res.redirect('/liteoptec/compare')
            }
        })
    })
})

router.get('/compare', (req, res) => {
    let oldNumbers = []
    for (let i = 0; i < OldSheet.length; i++) {
        let itemCode = OldSheet[i]['item number']
        let item = { 'item number': itemCode }
        oldNumbers.push(item)
    }
    let newNumbers = []
    for (let i = 0; i < NewSheet.length; i++) {
        let itemCode = NewSheet[i]['item number']
        let item = { 'item number': itemCode }
        newNumbers.push(item)
    }
    const dropped = _.difference(oldNumbers, newNumbers)
    console.log('Dropped items : ', dropped)
    const added = _.difference(newNumbers, oldNumbers)
    console.log('Added items :', added)
    for (let i = 0; i < OldSheet.length; i++) {
        for (let x = 0; x < NewSheet.length; x++) {
            if (OldSheet[i]['item number'] === NewSheet[x]['item number']) {
                if (OldSheet[i].pricing !== NewSheet[x].pricing) {
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
    const specification = {
        'item number': {
            displayName: 'Item Number',
            headerStyle: styles.headerDark,
            width: 120
        },
        pricing: {
            displayName: 'Pricing',
            headerStyle: styles.headerDark,
            width: 120
        }
    }
    const sending = toexcel.buildExport(
        [
            {
                name: 'Export',
                specification: specification,
                data: priceChanges
            }
        ]
    )
    res.attachment('export.xlsx')
    res.send(sending)
})

module.exports = router