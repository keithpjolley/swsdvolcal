var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('table', {
    title: "Startup Week San Diego"
  });
});

module.exports = router;