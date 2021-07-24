const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
require('dotenv').config()

const auth = require('./routes/auth')
const survey = require('./routes/survey')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())

app.use('/auth', auth.router)
app.use('/survey', survey)

app.get('/', (req,res) => {
    res.send("Server started!")
})

app.listen(port, () => {
    console.log("Server started at port: ", port)
})