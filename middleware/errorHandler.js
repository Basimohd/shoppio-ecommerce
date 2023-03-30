const errorHandler = (err, req, res, next)=> {
    console.error(err.stack);
    res.status(500)
    res.render('404')
  }

module.exports= {errorHandler}