'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = genSetAssociationEx;

var _utils = require('../../utils');

function genSetAssociationEx(aroModel) {
  return function setAssociationEx(submodelData) {
    var _this = this;

    var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var resultArray = (0, _utils.handleValueArrayForMethod)(this, this.setAssociationEx, submodelData, parent);
    if (resultArray) return resultArray;
    var submodelName = submodelData.model,
        value = submodelData.value,
        _submodelData$options = submodelData.options,
        options = _submodelData$options === undefined ? {} : _submodelData$options,
        originalOptions = submodelData.originalOptions,
        submodels = submodelData.submodels,
        _submodelData$callbac = submodelData.callbackPromise,
        callbackPromise = _submodelData$callbac === undefined ? _utils.defaultCallbackPromise : _submodelData$callbac;

    if ((0, _utils.isFunction)(value)) {
      try {
        value = value({ parent: parent, inputData: submodelData });
      } catch (e) {
        return Promise.reject(e);
      }
    }
    var submodel = this.getAroModel().getSubmodel(submodelName);
    var methodName = 'set' + (0, _utils.capitalizeFirstLetter)(submodel.asSingular);

    return (0, _utils.handlePromiseCallback)(this[methodName](value, originalOptions), parent, callbackPromise).then(function (result) {
      var associationResult = result;
      while (Array.isArray(associationResult)) {
        associationResult = associationResult[0];
      }

      if (value.dataValues) {
        value.dataValues[submodel.throughName] = associationResult;
        if (submodel.isSingular) {
          _this.dataValues[submodelName] = value;
        } else {
          _this.dataValues[submodelName] = _this.dataValues[submodelName] || [];
          _this.dataValues[submodelName].push(value);
        }
        if (result && submodels) {
          var newParent = { result: _this, associationResult: result, parent: parent, inputData: submodelData };
          return value.setAssociationEx(submodels, newParent).then(function (submodelResult) {
            return _this;
          });
        }
      }
      return _this;
    });
  };
}