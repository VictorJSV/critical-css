const criticalFactory = require("./lib/critical");
const config          = require("./config/options");
const environments    = require("./config/environments");

(function(environment){
  if (environment === "prod"){
    criticalFactory.runCriticalProdFactory(config);
  } else {
    criticalFactory.runCriticalFactory(config, environment, environments);
  }
})(process.env.ENV);