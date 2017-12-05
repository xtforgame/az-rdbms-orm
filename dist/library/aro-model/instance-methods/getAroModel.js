"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = genGetAroModel;
function genGetAroModel(aroModel) {
  return function getAroModel() {
    return aroModel;
  };
}