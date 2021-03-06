// const debug = require('debug')('myApp:someComponent');
// debug('Here is a pretty object %o', { someObject: true });
var mysql = require('mysql2');

/////////////////////////////////////////////////////////
// handle environment variables
/////////////////////////////////////////////////////////
// use dotenv to read .env vars into Node but silence the Heroku log error for production as no .env will exist
require('dotenv').config( { silent: process.env.NODE_ENV === 'production' } );

// process.env.NODE_ENV is set by heroku with a default value of production
if (process.env.NODE_ENV === 'production') {
  console.log("in PROD");
  // connect to the JawsDB on heroku
  connection = mysql.createConnection(process.env.JAWSDB_URL);
} else {
  console.log("in DEV");
  // use the connection info from the .env file otherwise
  require('dotenv').load();
}
// console.log("process env: " + JSON.stringify(process.env,null,'\t'));


//////////////////////////
// dependencies
//////////////////////////
var express = require("express");
var bodyParser = require("body-parser");
var session = require('express-session');
var path = require('path');

var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var passport = require('passport');
// var fs = require('fs');
// var https = require('https');

var db = require("./models");                               // models are required to sync them
var expressValidator = require('express-validator');

///////////////////////
// configure Express
///////////////////////
var app = express();
app.use(express.json());

// sets the port info
app.set('port', (process.env.PORT || 8080));

// body parsing middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// serve static folders
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/assets/img')); 

/////////////////
// handlebars
/////////////////
var exphbs = require("express-handlebars");

// handlebar views
app.set('views', path.join(__dirname, 'views'));
var hbs  = require('./views/helpers/handlebars.js')(exphbs);


// hbs.registerHelper("formatDate", function(datetime, format) {
//   if (moment) {
//     // can use other formats like 'lll' too
//     format = DateFormats[format] || format;
//     return moment(datetime).format(format);
//   }
//   else {
//     return datetime;
//   }
// });

// app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

/////////////////////
// Expess Session
/////////////////////
// console.log("secret: " +  process.env.SECRET_KEY);
app.use(session({
  secret: process.env.SECRET_KEY,     // put this in the heroku environment variables
  saveUninitialized: true,
  resave: true
}));

///////////////////////////
// Express validator
///////////////////////////
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// connect-flash (for messages stored in session)
app.use(flash());

// global vars for messages to be returned to the client
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

///////////////////////
//Passport Config
///////////////////////
// require('./config/passport')(passport);
// var LocalStrategy = require('passport-local').Strategy;

var request = require('request');
var querystring = require('querystring');
// Passport init
// app.use(passport.initialize());
// app.use(passport.session());
//NOT SURE IF THIS IS REALLY NEEDED BUT HERE IT IS ANYWAY
//const SERVER_SECRET = 'potato';

//require('./app/routes.js')(app, passport, SERVER_SECRET);

/*
/////////////////////////////////////
// configure spotify authentication
/////////////////////////////////////

var SpotifyStrategy = require('passport-spotify').Strategy;

passport.use(
  new SpotifyStrategy(
    {
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: 'http://localhost:8888/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({ spotifyId: profile.id }, function(err, user) {
        return done(err, user);
      });
    }
  )
);
*/ 

//using passport-spotify
/*
var SpotifyStrategy = require('passport-spotify').Strategy;

var SPOTIFY_ID;
var SPOTIFY_SECRET;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new SpotifyStrategy(
    {
      clientID: SPOTIFY_ID,
      clientSecret: SPOTIFY_SECRET,
      callbackURL: 'http://localhost:8080/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({ spotifyId: profile.id }, function(err, user) {
        return done(err, user);
      });
    }
  )
);
*/ 


/*
//Spotify constructors

var spotify = {
  id: process.env.SPOTIFY_ID,
  secret: process.env.SPOTIFY_SECRET
};


function displaySpotify() {
  var spotify = new Spotify(config.spotify);
  spotify.search({type: 'track', query: arg2, limit: 3}, function(error, data) {
      if (error) {
          return console.log("Error while retrieving a user's song: " + error);
      } else {
          console.log("Here are some songs that matched your search: ");
          for (var i = 0; i <= 2; i++) {
              var songInfo = data.tracks.items[i];
              console.log("-----------------------------------------" +
                          "\nArtists: " + songInfo.artists[0].name + 
                          "\nSong: " + songInfo.name +
                          "\nPreview: " + songInfo.external_urls.spotify +
                          "\nAlbum: " + songInfo.album.name);
          }
          
      }
  });
}
*/

////////////////////////////////////////////////////////
// Import routes and give the server access to them.
////////////////////////////////////////////////////////
var routes = require("./controllers/app_controller.js");

app.use(routes);

////////////////////////////////////////////////////////////////////////////
// syncing our sequelize models and then start listening for requests
// use 'force: true' in sync call to override schema definition
////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// ***IMPORTANT***  use this for DEV while schema is in flux 
// set force=true to override schema
/////////////////////////////////////////////////////////////////
// db.sequelize
//     .query('SET FOREIGN_KEY_CHECKS = 0', null, {raw: true})
//     .then(function(results) {
//         db.sequelize.sync({force: true})
//         .then (function() {
//             db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, {raw: true})
//         })
//         .then(function() {
//             app.listen(app.get('port'), function() {
//                 console.log("App now listening at localhost: " + app.get('port'));
//             });
//     });
// });

///////////////////////////////
// use this for QA and PROD
///////////////////////////////
db.sequelize.sync({})
    .then(function() {
        app.listen(app.get('port'), function() {
            console.log("App now listening at localhost: " + app.get('port'));
        });
    }).catch (function(error) { 
      console.log("Unable to sync the database.", error); 
    });


