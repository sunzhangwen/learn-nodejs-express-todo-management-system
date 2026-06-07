const {Sequelize} = require('sequelize')

const sequelize = new Sequelize('js_test_db', 'admin', 'abcd1234', {
    host:'localhost',
    dialect:'mysql',
    logging:false
})

module.exports = sequelize