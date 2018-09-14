function hbsHelpers(hbs) {
    return hbs.create({
        defaultLayout: "main",
        helpers: { 
            inc: function(value, options) {
                console.log('reading it');
                return parseInt(value) + 1;
            }
  
        // More helpers...
      }
  
    });
  }
  
  module.exports = hbsHelpers;