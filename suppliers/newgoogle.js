const express = require('express');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/'
});
let router = express.Router();

router.get('/', (req, res) => {
    res.render('indexg')
})

router.post('/', upload.single('old-sheet'), function (req, res, next) {
    res.redirect('/newgoogle/after')
})

router.get('/after', (req, res) => {
    res.render('after')
})

module.exports = router