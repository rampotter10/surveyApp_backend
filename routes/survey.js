const express = require('express')
const router = express.Router()
const authenticate = require('./auth').authenticate
const db = require('../database/db')

router.post('/create', authenticate, (req,res,next) => {
   var questions = req.body.questions
   const creator = req.user
    try {
        questions.forEach(async question => {
            await createSurvey(question, creator)
        })
        res.status(201).send({msg:"Survey created successfully!"})
    } catch(err) {
        res.status(400).send(err)
    }
   
})

router.get('/get', authenticate, async (req,res,next) => {
    var creatorID = req.body.id
    try {
        var surveys = []
        var searchedSurveys = await getSurvey(creatorID)
        searchedSurveys.forEach(survey => {
            surveys.push(survey)
        })
        res.status(200).send(surveys)
    } catch(err) {
        res.status(400).send(err)
    }
})

router.post('/save', authenticate, (req,res,next) => {
    var responses = req.body.responses
    try {
        var user = req.user
        responses.forEach(async response => {
            await saveResponse(response, user)
        })
        res.status(200).send({msg: "Responses saved successfully!"})
    } catch(err) {
        res.status(400).send(err)
    }
})

function createSurvey(ques, creator) {
    var row = {creatorID: creator.id, question: ques, opt1: 'Yes', opt2: 'No', createdAt: new Date().toISOString()}
    return db('survey').insert(row)
    
}

function getSurvey(id) {
    return db('survey').where("creatorID",id).select("*")
}

function saveResponse(response,user) {
    const row = {
        questionID: response.questionID, 
        creatorID: response.creatorID,
        responderID: user.id,
        response: response.response,
        createdAt: new Date().toISOString()
    }

    return db('survey-response').insert(row)
}

module.exports = router