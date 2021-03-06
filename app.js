// Load dependencies
const express = require('express')
const app = express()
let pricelists = require('./workers/pricelists')
let stocksheets = require('./workers/stocksheets')
let stocksheetcompare = require('./workers/stocksheetcompare')

// Load view templates
app.set('views', './views')
app.set('view engine', 'pug')

// Setup routes
app.use('/pricelists', pricelists)
app.use('/stocksheets', stocksheets)
app.use('/stocksheetcompare', stocksheetcompare)

// Visiting domain will render main homepage
app.get('/', (req, res) => {
    res.render('home', {text: 'Welcome!'})
})

app.listen(process.env.PORT || 3000)
