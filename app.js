const express = require('express')
const axios = require('axios')
const app = express()
let code = null
let token = null
let accountId = 4965623000000008002n
let folderId = 4965623000000008014n
let oldStock
let newStock

app.set('views', './views')

app.set('view engine', 'pug')

app.get('/', (req, res) => {
    res.render('index', {text: 'hello'})
})

app.get('/get', (req, res) => {
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
    // console.log("Zoho: ", zoho)
    // console.log("Token: ", token)
    zoho.get('kspsmb1b84b1d7c014acb8ed2ea1f2c374d47?method=worksheet.records.fetch&worksheet_name=Price and stock sheet 27-05-202')
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
    zoho.get('kspsmb1b84b1d7c014acb8ed2ea1f2c374d47?method=worksheet.records.fetch&worksheet_name=Price and stock sheet 27-05_1')
        .then(function (response) {
            newStock = response.data.records
            res.redirect('/response')
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

app.get('/response', (req, res) => {
    console.log('template rendered', oldStock)
    res.render('response')
})

app.get('/doCompare', (req, res) => {
    res.render('compare')
})

app.listen(process.env.PORT || 3000)