"use strict";

const expect       = require("chai").expect;
const critical     = require("../task/lib/critical");
const config       = require("./config/options");
const environments = require("./config/environments");

let params = {};

describe("Module: inline-critical", function () {
  beforeEach(function () {
    params.config = Object.assign({}, config);
  });

  context("Bad Config", function() {
    it("should return error with undefined configs", function () {
      expect(() => critical.runCriticalFactory(undefined, undefined, undefined)).to.throw()
    });

    it("should not return error with undefined host", function () {
      let environment = "pre";
      params.config.host = undefined;
      expect(() => critical.runCriticalFactory(params.config, environment, environments)).to.not.throw()
    });
  });

  context("Bad Environment", function() {
    it("should return default host if environment doesn't exist", function () {
      let environment = "otherEnv";
      expect(() => critical.runCriticalFactory(params.config, environment, environments)).to.not.throw()
    });

    it("should return default host if environment is undefined", function () {
      let environment = undefined;
      expect(() => critical.runCriticalFactory(params.config, environment, environments)).to.not.throw()
    });


    it("should return error with undefined {} config.host", function () {
      let environment = "otherEnv";
      params.config.host = undefined;
      expect(() => critical.runCriticalFactory(params.config, environment, environments)).to.throw()
    });

    it("should return error default host", function () {
      let environment = "otherEnv";
      let environments = undefined;
      expect(() => critical.runCriticalFactory(params.config, environment, environments)).to.throw()
    });
  })
});