export default class AppError extends Error{
    constructor(message, status){
        super(message);
        this.status        = status || 500
        this.isOperational = true;
    }
}


export function errorHandler(err, req, res, next) {
  if(process.env.DEVELOPMENT === "YES"){
      console.log("Is in development status: ", process.env.DEVELOPMENT)
      errorDevelopment(err, res)
    }else{
      console.log("Is in development status: NO" )
      errorProduction (err, res)
    } 
}




function errorDevelopment(err, res){
    res.status(err.status || 500)   .json({
      message: err.message
    });
    console.error(
      "message: ",          err.message || "unexpected error",
      "\nStatus: ",         err.status || 500 ,
      "\nisOperational: ",  err.isOperational || false,
      "\nstock:",           err.stack || 'no stack'
      )
}

function errorProduction (err, res){
     if(err.status < 500){
        res.status(err.status || 500).json({
          message: err.message || "unexpected error"
        });
      }

      if(err.status >= 500){
        res.status(500)              .json({
          message: "something goes wrong, try again later or contact with us"
        })
        console.error(
          "message: ",          err.message || "unexpected error",
          "\nStatus: ",         err.status || 500 ,
          "\nisOperational: ",  err.isOperational || false,
          "\nstock:",           err.stack || 'no stack'
        )
  }
}
