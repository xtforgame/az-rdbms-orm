'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genBulkCreateEx = genBulkCreateEx;
exports.genBulkCreateExx = genBulkCreateExx;

var _utils = require('../../utils');

function genBulkCreateEx(aroModel) {
  return function bulkCreateEx(array) {
    var _this = this;

    var allPromise = [];
    return aroModel.db.transaction(function (t) {
      return (0, _utils.toSeqPromise)(array, function (_, item) {
        var p = _this.create(item, { transaction: t });
        allPromise.push(p);
        return p;
      });
    }).then(function () {
      return Promise.all(allPromise);
    });
  };
}

function genBulkCreateExx(aroModel) {
  return function bulkCreateExx(array) {
    var _this2 = this;

    return Promise.all(array.map(function (item) {
      return _this2.create(item);
    }));
  };
}