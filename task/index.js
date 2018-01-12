const criticalFactory = require("./lib/critical");
const config          = require(process.env.CONFIG + "/options");
const environments    = require(process.env.CONFIG + "/environments");

(function(environment){
  if (environment === "prod"){
    criticalFactory.runCriticalProdFactory(config);
  } else {
    criticalFactory.runCriticalFactory(config, environment, environments);
  }
})(process.env.ENV);