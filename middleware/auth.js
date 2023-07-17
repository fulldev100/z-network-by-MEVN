const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
  
  const token = req.header('Authorization')

  if(!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' })
  }

  try {
    
    const decoded = jwt.verify(token, 'my_secret_key')

    req.user = decoded;

    next()

  } catch (err) {
    console.error(err.message)
    res.status(401).json({ msg: 'Token is not valid' })
  }
}