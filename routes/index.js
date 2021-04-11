var express = require('express');
var router = express.Router();

// Перенапрвление на корневую страницу каталога
router.get('/', function(req, res) {
  res.redirect('/catalog');
});

module.exports = router;