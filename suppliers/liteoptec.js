let express = require('express')
const axios = require('axios')
let router = express.Router()
let code = null
let workbook_name = 'Lite Optec'

router.get('/', (req, res) => {
    res.redirect('https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MAUUUZO4JJ0D5UOS7NA1XJA6EIJADH&scope=ZohoSheet.dataAPI.READ&redirect_uri=https://futurama-app.herokuapp.com/liteoptec/redirect')
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
            console.log(response.data.workbooks)
            let workbooks = response.data.workbooks
            for (let index = 0; index < workbooks.length; index++) {
                if (workbooks[index].workbook_name === workbook_name) {
                    currentWorkbook = workbooks[index].resource_id
                    console.log(currentWorkbook)
                    res.render('lo', { currentWorkbook: currentWorkbook })
                }
            }
        })
        .catch(function (error) {
            console.log('errorFG', error)
        })
})

module.exports = router