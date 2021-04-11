var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/cool/:coolId', function(req, res, next){
  res.send('Ну, вы крутой ' + req.params.coolId);
});

module.exports = router;
