'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = genCreateAssociationEx;

var _utils = require('../../utils');

function genCreateAssociationEx(aroModel) {
  return function createAssociationEx(submodelData) {
    var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var resultArray = (0, _utils.handleValueArrayForMethod)(this, this.createAssociationEx, submodelData, parent);
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
    var promise = null;
    if (submodel.association.type === 'belongsTo' && submodel.association.isSingular) {
      promise = submodel.model.createEx({
        value: value,
        options: options,
        originalOptions: originalOptions,
        submodels: submodels,
        callbackPromise: callbackPromise
      }, parent);
    } else {
      var methodName = 'create' + (0, _utils.capitalizeFirstLetter)(submodel.asSingular);
      promise = this[methodName](value, originalOptions);
    }
    return (0, _utils.handlePromiseCallback)(promise, parent, callbackPromise).then(function (result) {
      if (result && submodels) {
        var newParent = { result: result, parent: parent, inputData: submodelData };
        return result.createAssociationEx(submodels, newParent).then(function (submodelResult) {
          var resultDataValues = result.dataValues;
          submodels.forEach(function (modelInput, i) {
            resultDataValues[modelInput.model] = submodelResult[i];
          });
          if (submodel.association.isSingular) {
            return result;
          }
          return [result];
        });
      }
      if (submodel.association.isSingular) {
        return result;
      }
      return [result];
    });
  };
}