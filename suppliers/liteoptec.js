const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const excel = require('xlsx-to-json-lc');
const toexcel = require('node-excel-export');
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
                res.redirect('/newgoogle/new')
                console.log(result)
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
                res.redirect('/newgoogle/compare')
                console.log(result)
            }
        })
    })
})

router.get('/compare', (req, res) => {
    if (OldSheet.length === NewSheet.length) {
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
    } else {
        for (let i = 0; i < OldSheet.length; i++) {
            if (NewSheet.includes(OldSheet[i])) {
                console.log("Item found")
                newItems.push(OldSheet[i])
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
                    name: 'Exportf',
                    specification: specification,
                    data: newItems
                }
            ]
        )
        res.attachment('exportf.xlsx')
        res.send(sending)
    }
})

module.exports = router