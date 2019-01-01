const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error', silent: true }),
      new winston.transports.File({filename: './logs/info.log', level: 'info', silent: true}),
      new winston.transports.File({ filename: './logs/combined.log', silent: true })
    ]
  });
  
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }

  exports.info = function(message){
      logger.info(message);
      return;
  }

  exports.error = function(message){
      logger.error(message);
      return;
  }