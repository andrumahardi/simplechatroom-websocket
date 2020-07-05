const router = require('express').Router()
const fs = require('fs')

router.get('/', async (_, res) => {
    fs.readFile('dummy.json', (err, data) => {
        const { avatars } = JSON.parse(data)
        res.send({ avatars })
    })
})

module.exports = router