const router = require('express').Router()

router.get('/', (_, res) => {
    res.send('connected to server')
})

module.exports = router