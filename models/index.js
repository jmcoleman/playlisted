'use strict';

var fs        = require('fs');
var path      = require('path');
const Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.js')[env];
var db        = {};

//sequelize constructors
// console.log("config is: " + JSON.stringify(config));
if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}
// console.log("database: " + config.database + "\nusername: " + config.username + "\npassword: " + config.password + "\nconfig: " +  JSON.stringify(config,null,'\t'));

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
