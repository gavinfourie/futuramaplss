const express = require('express')
const axios = require('axios')
const app = express()
let code = null
let token = null
let accountId = 4965623000000008002n
let folderId = 4965623000000008014n
let liteoptec = require('./suppliers/liteoptec')
let oldStock
let newStock
let newItems = []
let priceChanges = []
let worksheet_name = null
let workbook_name = null
let currentWorkbook = null

app.set('views', './views')
app.set('view engine', 'pug')

app.use('/liteoptec', liteoptec)

app.get('/', (req, res) => {
    oldStock = null
    newStock = null
    newItems = []
    priceChanges = []
    res.render('index', {text: 'hello'})
})

app.get('/prices', (req, res) => {
    res.render('prices')
})

app.get('/get', (req, res) => {
    worksheet_name = 'Old Stock'
    res.redirect('https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&scope=ZohoSheet.dataAPI.READ&redirect_uri=https://futurama-app.herokuapp.com/redirect')
})

app.get('/redirect', (req, res) => {
    code = req.query.code
    console.log(code)
    res.redirect('/token')
})

app.get('/token', (req, res) => {
    axios.post(`https://accounts.zoho.com/oauth/v2/token?code=${code}&grant_type=authorization_code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&client_secret=a78690fdc6ecf1e65395b462e5e484833f0fab18d3&redirect_uri=https://futurama-app.herokuapp.com/redirect`)
        .then(function (response) {
            console.log(response.data)
            token = response.data.access_token
            console.log("Access Token: ", token)
            res.redirect('/start')
        })
        .catch(function (error) {
            console.log(error)
        })
})

app.get('/start', (req, res) => {
    const zoho = axios.create({
        baseURL: `https://sheet.zoho.com/api/v2/`,
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get('kspsmb1b84b1d7c014acb8ed2ea1f2c374d47?method=worksheet.records.fetch&worksheet_name=Old Stock')
        .then(function (response) {
            oldStock = response.data.records
            res.redirect('/newStock')
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

app.get('/newStock', (req, res) => {
    const zoho = axios.create({
        baseURL: `https://sheet.zoho.com/api/v2/`,
        timeout: 20000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
    })
    zoho.get('kspsmb1b84b1d7c014acb8ed2ea1f2c374d47?method=worksheet.records.fetch&worksheet_name=New Stock')
        .then(function (response) {
            newStock = response.data.records
            res.redirect('/response')
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

app.get('/response', (req, res) => {
    res.render('response')
})

app.get('/doCompare', (req, res) => {
    if (oldStock.length === newStock.length) {
        for (let i = 0; i < oldStock.length; i++) {
            for (let x = 0; x < newStock.length; x++) {
                if (oldStock[i].ItemNumber === newStock[x].ItemNumber) {
                    if (oldStock[i].Pricing !== newStock[x].Pricing) {
                        priceChanges.push(newStock[x])
                    }
                }
            }
        }
        res.render('compare', { length: true, change: true, prices: priceChanges })
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

app.listen(process.env.PORT || 3000)