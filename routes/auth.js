const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const db = require('../database/db')

router.post('/signup', async(req, res) => {
    var user = req.body
    var password = user.password
    delete user.password

    try {
        const searchedUser = await getUser(user.email)
        if(searchedUser.length > 0) {
            res.status(400).send('User with same email already exists.')
        }else {
            var salt = crypto.randomBytes(16).toString(`hex`)
            var hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)
            user = {...user, salt: salt,hash: hash}
            const newUser = await createUser(user)
            res.status(201).send({msg: 'User created. You can login now.'})
        }
    } catch(err) {
        res.status(400).send(err)
    }
    
})

router.post('/userLogin', async (req,res) => {
    var email = req.body.email
    var password = req.body.password

    const validated = await validatePassword(email,password)

    if(validated.valid) {
        const token = 'Bearer ' + genToken(validated.user)
        res.status(200).send({user: validated.user, token: token})
    }else {
        res.status(403).send(validated.err)
    }
})

router.post('/guestLogin', async (req,res) => {
    var user = req.body
    try {
        var foundUser = await getUser(user.email)
        if(foundUser[0] !== undefined) {
            var token = 'Bearer ' + genToken(foundUser[0])
            res.status(200).send({token: token, user: foundUser[0]})
        } else {
            delete user.password
            var newUser = await createUser(user)
            if(newUser.length > 0) {
                var loggedInUser = await getUser(user.email)
                var token = genToken(loggedInUser[0])
                res.status(200).send({token: token, user: loggedInUser[0]})
            }
        }
    } catch(err) {
        console.log(err)
        res.status(403).send({msg: 'Unauthorized', err: err})
    }
})

function createUser(user) {
    const row = {...user, createdAt: new Date().toISOString()}
    console.log(row)
    return db('users').insert(row)
}

function getUser(email) {
    return db('users').where('email',email).select('*')
}

async function validatePassword(email,password) {
    try{
        const user = await getUser(email)
        var salt = user[0].salt
        var hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)
        return {valid: user[0].hash == hash, user: user[0], err: null}
    } catch(err) {
        console.log(err)
        return {valid: false, user: null, err: err}
    }
}

function genToken(user) {
    var expTime = 12*60*60
    var token = jwt.sign(user,process.env.JWT_SECRET, {expiresIn: expTime})
    return token
}

function authenticate(req,res,next) {
    const token = req.headers.authorization
    if(token !== undefined) {
        const bearerToken = token.split(' ')[1]
        try{
            const verified = jwt.verify(bearerToken, process.env.JWT_SECRET)
            if(verified) {
                req.token = bearerToken
                req.user = verified
                next()
            }
        } catch(err) {
            console.log(err)
            res.status(403).send('Unauthorized!')
            next()
        }
        
    } else {
        res.status(403).send('Bearer token not available!')
        next()
    }
}

module.exports = {
    router: router,
    authenticate: authenticate
}