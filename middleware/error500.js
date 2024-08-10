const errorHandlerMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { 
      title: 'Internal Server Error'
    });
  };
  
  module.exports = { errorHandlerMiddleware };