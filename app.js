const express = require('express')
const app = express()


app.get('/', (req, res) => {
    console.log("welcome")
})

app.get('/get', (req, res) => {
    res.redirect('https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&scope=ZohoSheet.dataAPI.READ&redirect_uri=https://www.futurama-app.herokuapp.com/redirect')
})

app.get('/redirect', (req, res) => {
    console.log(req)
})

app.listen(process.env.PORT || 3000)