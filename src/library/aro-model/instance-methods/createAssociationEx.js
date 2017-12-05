import {
  capitalizeFirstLetter,
  defaultCallbackPromise,
  isFunction,
  handleValueArrayForMethod,
  handlePromiseCallback,
} from '../../utils';

export default function genCreateAssociationEx(aroModel) {
  return function createAssociationEx(submodelData, parent = null) {
    const resultArray = handleValueArrayForMethod(this, this.createAssociationEx, submodelData, parent);
    if (resultArray) return resultArray;
    let {
      model: submodelName,
      value,
      options = {},
      originalOptions,
      submodels,
      callbackPromise = defaultCallbackPromise,
    } = submodelData;
    if (isFunction(value)) {
      try {
        value = value({ parent, inputData: submodelData });
      } catch (e) {
        return Promise.reject(e);
      }
    }
    const submodel = this.getAroModel().getSubmodel(submodelName);
    let promise = null;
    if (submodel.association.type === 'belongsTo' && submodel.association.isSingular) {
      // for fix the weird behavior of sequilze
      promise = submodel.model.createEx({
        value,
        options,
        originalOptions,
        submodels,
        callbackPromise,
      }, parent);
    } else {
      const methodName = `create${capitalizeFirstLetter(submodel.asSingular)}`;
      promise = this[methodName](value, originalOptions);
    }
    return handlePromiseCallback(promise, parent, callbackPromise)
      .then((result) => {
        if (result && submodels) {
          const newParent = { result, parent, inputData: submodelData };
          return result.createAssociationEx(submodels, newParent)
            .then((submodelResult) => {
              const resultDataValues = result.dataValues;
              submodels.forEach((modelInput, i) => {
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

