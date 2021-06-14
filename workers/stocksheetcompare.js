// Import all dependencies
const express = require('express');
let router = express.Router();
const formidable = require('formidable');
const _ = require('lodash');
const xtj = require('convert-excel-to-json');
const csv = require("csvtojson");
const toexcel = require('node-excel-export');
let magento = []
let dearInStock = []
let dearOutStock = []
let dylanInStock =[]
let dylanOutStock = []
let nightvisionIn = []
let allOut = []

// Visiting stock sheet home clears all variables and renders home stocksheet page
router.get('/', (req, res) => {
    magento = []
    dearInStock = []
    dearOutStock = []
    dylanInStock =[]
    dylanOutStock = []
    nightvisionIn = []
    res.render('stocksheetcomparehome')
})

// Start the comparison by uploading old sheet first in formdata so that Formidable can handle it
router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm()
    // Have formidable extract excel file into json array
    form.parse(req, async (err, fields, files) => {
        let sfile = files['magento-sheet'].path
        let tempMagentoInStock = []
        let jfile = await csv({
            ignoreEmpty: true,
        }).fromFile(sfile).then((jsonObj)=>{
            tempMagentoInStock.push(jsonObj)
        })
        for (var sheet in tempMagentoInStock) {
            for (var item in tempMagentoInStock[sheet]) {
                magento.push(tempMagentoInStock[sheet][item])
            }
        }
        res.redirect('/stocksheetcompare/dear')
    })
})

router.get('/dear', (req, res) => {
    res.render('stocksheetcomparedear')
})

// Start uploading new sheet
router.post('/dear', (req, res, next) => {
    const form = new formidable.IncomingForm()
    form.parse(req, async (err, fields, files) => {
        let sfile = files['dear-sheet'].path
        let tempDearStock = []
        let jfile = await csv({
            ignoreEmpty: true,
        }).fromFile(sfile).then((jsonObj)=>{
            tempDearStock.push(jsonObj)
        })
        for (var sheet in tempDearStock) {
            for (var item in tempDearStock[sheet]) {
                if (tempDearStock[sheet][item].Available > 0){
                    dearInStock.push(tempDearStock[sheet][item])
                } else {
                    dearOutStock.push(tempDearStock[sheet][item])
                }
            }
        }
        res.redirect('/stocksheetcompare/dylan')
    })
})

router.get('/dylan', (req, res) => {
    res.render('stocksheetcomparedylan')
})

// Start uploading new sheet
router.post('/dylan', (req, res, next) => {
    const form = new formidable.IncomingForm()
    form.parse(req, async (err, fields, files) => {
        let sfile = files['dylan-sheet'].path
        let jfile = xtj({
            sourceFile: sfile,
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        })
        for (var sheet in jfile) {
            for (var item in jfile[sheet]) {
                if (jfile[sheet][item].SOH > 0 && jfile[sheet][item]['Product Name'].length > 1) {
                    dylanInStock.push(jfile[sheet][item])
                } else if (jfile[sheet][item].SOH == 0) {
                    dylanOutStock.push(jfile[sheet][item])
                }
            }
        }
        res.redirect('/stocksheetcompare/schalk')
    })
})

router.get('/schalk', (req, res) => {
    res.render('schalk')
})

router.post('/schalk', (req, res, next) => {
    const form = new formidable.IncomingForm()
    form.parse(req, async (err, fields, files) => {
        let sfile = files['schalk-sheet'].path
        let jfile = xtj({
            sourceFile: sfile,
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        })
        for (var sheet in jfile) {
            for (var item in jfile[sheet]) {
                if (jfile[sheet][item].Quantity > 0 && jfile[sheet][item]['Product Name'].length > 1){
                    nightvisionIn.push(jfile[sheet][item])
                }
            }
        }
        res.redirect('/stocksheetcompare/compare')
    })
})

// Start comparison
router.get('/compare', (req, res) => {
    // Find Items to change to out of stock from dear
    let protoDearOut = []
    for (let i = 0; i < dearOutStock.length; i++) {
        for (let x = 0; x < magento.length; x++) {
            if (dearOutStock[i].SKU == magento[x].SKU) {
                protoDearOut.push(magento[x])
            }
        }
    }

    // Find items to change to out of stock from dylan
    let protoDylanOut = []
    for (let i = 0; i < dylanOutStock.length; i++) {
        for (let x = 0; x < magento.length; x++) {
            if (dylanOutStock[i].SKU == magento[x].SKU) {
                protoDylanOut.push(magento[x])
            }
        }
    }

    let protoChangeToOut = []
    let protoChangeToOutDear = []
    for (let i = 0; i < protoDearOut.length; i++) {
        for (let x = 0; x < protoDylanOut.length; x++) {
            if (protoDearOut[i].SKU == protoDylanOut[x].SKU) {
                protoChangeToOut.push(protoDearOut[i])
            } else {
                protoChangeToOutDear.push(protoDearOut[i])
            }
        }
    }

    let changeToOut = []
    for (let i = 0; i < protoChangeToOut.length; i++) {
        if (protoChangeToOut[i].title) {
            let item = { 'SKU': protoChangeToOut[i]['SKU'], 'Description': protoChangeToOut[i].title }
            changeToOut.push(item)
        }
    }

    let changeToOutDear = []
    for (let i = 0; i < protoChangeToOutDear.length; i++) {
        if (protoChangeToOutDear[i].title) {
            let item = { 'SKU': protoChangeToOutDear[i]['SKU'], 'Description': protoChangeToOutDear[i].title }
            changeToOutDear.push(item)
        }
    }

    let finalOut = _.uniqBy(changeToOut, 'SKU')
    let finalOutDear = _.uniqBy(changeToOutDear, 'SKU')


    // Make arrays of no duplicates
    let protoMagentoInStock = _.uniqBy(magento, 'SKU')
    let protoDearInStock = _.uniqBy(dearInStock, 'SKU')
    let protoAllInStock = []
    for (let x = 0; x < dylanInStock.length; x++) {
        protoAllInStock.push(dylanInStock[x])
    }
    for (let x = 0; x < nightvisionIn.length; x++) {
        protoAllInStock.push(nightvisionIn[x])
    }
    let protoDylanInStock = _.uniqBy(protoAllInStock, 'SKU')
    let inStock = _.differenceBy(protoDylanInStock, protoMagentoInStock, 'SKU')
    console.log(inStock)
    let tempChangeToIn = []
    for (let i = 0; i < inStock.length; i++) {
        if (inStock[i]['Product Name']) {
            let item = { 'SKU': inStock[i]['SKU'], 'Description': inStock[i]['Product Name'] }
            tempChangeToIn.push(item)
        }
    }
    let changeToInDylan = _.uniqBy(tempChangeToIn, 'SKU')
    let changeToInDear = []
    for (let i = 0; i < dearInStock.length; i++) {
        for (let x = 0; x < changeToInDylan.length; x++) {
            if (dearInStock[i].SKU !== changeToInDylan[x].SKU) {
                changeToInDear.push(dearInStock[i])
            }
        }
    }
    let finalInDear = []
    for (let i = 0; i < changeToInDear.length; i++) {
        if (changeToInDear[i]['ProductName']) {
            let item = { 'SKU': changeToInDear[i]['SKU'], 'Description': changeToInDear[i]['ProductName'] }
            finalInDear.push(item)
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
                name: 'Now Out Of Stock',
                specification: specification,
                data: finalOut
            },
            {
                name: 'Now Out Of Stock Dear',
                specification: specification,
                data: finalOutDear
            },
            {
                name: 'Now In Stock',
                specification: specification,
                data: changeToInDylan
            },
            {
                name: 'Now In Stock Dear',
                specification: specification,
                data: finalInDear
            }
        ]
    )
    // Send to browser to start download
    res.attachment('exports.xlsx')
    res.send(sending)
})

module.exports = router