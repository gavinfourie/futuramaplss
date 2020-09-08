const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const excel = require('xlsx-to-json-lc');
const toexcel = require('node-excel-export');
const _ = require('lodash');
const XLSX = require('xlsx');
const fs = require('fs');
let OldSheet = []
// let NewSheet
let priceChanges = []
let newItems = []

router.get('/', (req, res) => {
    res.render('indext')
})

router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()

    form.parse(req, (err, fields, files) => {
        let newFile = files['old-sheet']
        let wb = XLSX.readFile(newFile.path)
        let result = {};
        wb.SheetNames.forEach(function(sheetName) {
          let roa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header:1});
          if(roa.length) result[sheetName] = roa;
        });
        json = JSON.stringify(result, 2, 2);
        // newFile = files['old-sheet'].path
        // jsonRes = XLSX.readFile(newFile)
        // jsonSheet = XLSX.utils.sheet_to_json(jsonRes);
        console.log(json)
        // let all_sheets = jsonSheet.SheetNames
        let name = 'export'
        let book = XLSX.utils.book_new()
        let sheets = XLSX.utils.json_to_sheet(json)
        XLSX.utils.book_append_sheet(book, sheets, name)
        res.attachment('export.xlsx')
        res.send(book)
        /*while (ii < all_sheets.length) {
          let sheetName = jsonRes.SheetNames[ii]
          let sheet = jsonRes.Sheets[sheetName]
          // let sheetToJson = XLSX.utils.sheet_to_json(sheet)
          OldSheet.push(sheetToJson)
          ii += 1
        }*/
        // let sheet = jsonRes.Sheets[first_sheet]
        // OldSheet = XLSX.utils.sheet_to_json(sheet)
        // console.log(OldSheet)
        // res.redirect('/test/new')
        // Testing
        // console.log(OldSheet);
        // let wb = XLSX.utils.book_new()
        // let Final = XLSX.utils.json_to_sheet(OldSheet)
        // XLSX.utils.book_append_sheet(wb, Final, "Export")
        // let buf = XLSX.writeFile(wb, "Export.xlsx")
        // res.status(200).send
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
