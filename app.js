// Load dependencies
const express = require('express')
const app = express()
let pricelists = require('./workers/pricelists')

// Load view templates
app.set('views', './views')
app.set('view engine', 'pug')

// Setup workers
app.use('/pricelists', pricelists)

// Visiting domain will render main homepage
app.get('/', (req, res) => {
    res.render('home', {text: 'Welcome!'})
})

app.listen(process.env.PORT || 3000)
