const express = require('express')
const app = express()
let pricelists = require('./workers/pricelists')

app.set('views', './views')
app.set('view engine', 'pug')

app.use('/pricelists', pricelists)

app.get('/', (req, res) => {
    res.render('home', {text: 'Welcome!'})
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
