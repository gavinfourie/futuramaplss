const express = require('express')
const app = express()
let pricelists = require('./workers/pricelists')

app.set('views', './views')
app.set('view engine', 'pug')

app.use('/pricelists', pricelists)

app.get('/', (req, res) => {
    res.render('home', {text: 'Welcome!'})
})

app.listen(process.env.PORT || 3000)
