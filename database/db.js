const knex = require('knex')

const connection = new knex({
    client: 'sqlite3',
    connection: {
        filename: './database.sqlite3'
    },
    useNullAsDefault: true
})

module.exports = connection