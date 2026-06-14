const {Sequelize} = require('sequelize')

const sequelize = new Sequelize('{your db name}', '{your db user id}', '{user db user password}', {
    host:'localhost',
    dialect:'mysql',
    logging:false
})

module.exports = sequelize
