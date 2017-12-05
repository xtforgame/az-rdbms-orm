'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = genClassMethods;

var _bulkCreateEx = require('./bulkCreateEx');

function genClassMethods(aroModel) {
  return {
    bulkCreateEx: (0, _bulkCreateEx.genBulkCreateEx)(aroModel),
    bulkCreateExx: (0, _bulkCreateEx.genBulkCreateExx)(aroModel)
  };
}