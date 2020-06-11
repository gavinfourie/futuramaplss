const express = require('express')
const axios = require('axios')
const app = express()
let code = null
let token = null

app.set('views', './views')
app.set('view engine', 'pug')

app.get('/', (req, res) => {
    console.log("welcome")
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
            res.redirect('/start')
        })
        .catch(function (error) {
            console.log(error)
        })
})

const zoho = axios.create({
    baseURL: 'https://sheet.zoho.com/api/v2/',
    timeout: 5000,
    headers: {'Authorization': `Zoho-oauthtoken ${token}`}
})

app.get('/start', (req, res) => {
    zoho.get('workbooks')
        .then(function (response) {
            res.send(response)
        })
        .catch(function (error) {
            console.log(error)
        })
})

app.listen(process.env.PORT || 3000)