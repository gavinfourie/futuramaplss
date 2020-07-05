let express = require('express')
const axios = require('axios')
const { response } = require('express')
let router = express.Router()
let code = null
let workbook_name = 'Lite Optec'
let token = null
let oldPrices = []
let newPrices= []
let priceChanges = []

router.get('/', (req, res) => {
    oldPrices = []
    newPrices = []
    priceChanges = []
    res.redirect('https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&scope=ZohoSheet.dataAPI.READ,ZohoSheet.dataAPI.UPDATE&redirect_uri=https://futurama-app.herokuapp.com/liteoptec/redirect')
})

router.get('/redirect', (req, res) => {
    code = req.query.code
    axios.post(`https://accounts.zoho.com/oauth/v2/token?code=${code}&grant_type=authorization_code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&client_secret=a78690fdc6ecf1e65395b462e5e484833f0fab18d3&redirect_uri=https://futurama-app.herokuapp.com/liteoptec/redirect`)
        .then(function (response) {
            token = response.data.access_token
            res.redirect('/liteoptec/workbook')
        })
        .catch(function (error) {
            console.log(error)
        })
})

router.get('/workbook', (req, res) => {
    const zoho = axios.create({
        baseURL: 'https://sheet.zoho.com/api/v2/',
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get('workbooks?method=workbook.list')
        .then(function (response) {
            let workbooks = response.data.workbooks
            for (let index = 0; index < workbooks.length; index++) {
                if (workbooks[index].workbook_name === workbook_name) {
                    currentWorkbook = workbooks[index].resource_id
                    res.redirect('/liteoptec/start')
                }
            }
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

router.get('/start', (req, res) => {
    const zoho = axios.create({
        baseURL: `https://sheet.zoho.com/api/v2/`,
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get(`${currentWorkbook}?method=worksheet.records.fetch&worksheet_name=Old Prices`)
        .then(function (response) {
            oldPrices = response.data.records
            res.redirect('/liteoptec/continue')
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

router.get('/continue', (req, res) => {
    const zoho = axios.create({
        baseURL: `https://sheet.zoho.com/api/v2/`,
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get(`${currentWorkbook}?method=worksheet.records.fetch&worksheet_name=New Prices`)
        .then(function (response) {
            newPrices = response.data.records
            res.redirect('/liteoptec/end')
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

router.get('/end', (req, res) => {
    if (oldPrices.length === newPrices.length) {
        for (let i = 0; i < oldPrices.length; i++) {
            for (let x = 0; x < newPrices.length; x++) {
                if (oldPrices[i].ItemNumber === newPrices[x].ItemNumber) {
                    if (oldPrices[i].Pricing !== newPrices[x].Pricing) {
                        priceChanges.push({ItemNumber: newPrices[x].ItemNumber, Pricing: newPrices[x].Pricing })
                    }
                }
            }
        }
        res.redirect('/liteoptec/add')
    } else {
        for (let i = 0; i < oldStock.length; i++) {
            if (newStock.includes(oldStock[i])) {
                console.log("Item found")
                newItems.push(oldStock[i])
            }
        }
        res.render('compare', { length: false, change: false, prices: newItems })
    }
})

router.get('/add', (req, res) => {
    let data = JSON.stringify(priceChanges)
    console.log(data)
    const zoho = axios.create({
        baseURL: `https://sheet.zoho.com/api/v2/`,
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get(`${currentWorkbook}?method=row.insert&worksheet_name=Price changes&json_data=${data}`)
        .then(function (response) {
            console.log(response.data)
            res.render('compare', { length: true, change: true, prices: priceChanges })
        })
        .catch(function (error) {
            console.log('Error From Final', error.response.data)
        })
})

module.exports = router