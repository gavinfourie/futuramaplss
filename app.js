const express = require('express')
const axios = require('axios')
const app = express()
let code = null
let token = null
let accountId = 4965623000000008002n
let folderId = 4965623000000008014n
let emails

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index', {text: 'hello'})
})

app.get('/get', (req, res) => {
    res.redirect('https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&scope=ZohoMail.messages.READ&redirect_uri=https://futurama-app.herokuapp.com/redirect')
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
        baseURL: `http://mail.zoho.com/api/accounts/${accountId}/messages/`,
        timeout: 10000,
        headers: {'Authorization': `Zoho-oauthtoken ${token}`},
        data: {
            folderId: `${folderId}`,
        }
    })
    console.log("Zoho: ", zoho)
    console.log("Token: ", token)
    zoho.get('view')
        .then(function (response) {
            emails = response.data.data
            console.log('responseFG:', response.data.data )
            res.render('response', { emails: emails })
        })
        .catch(function (error) {
            console.log('errorFG', error.response)
        })
})

app.listen(process.env.PORT || 3000)