import {
  capitalizeFirstLetter,
  defaultCallbackPromise,
  isFunction,
  handleValueArrayForMethod,
  handlePromiseCallback,
} from '../../utils';

export default function genAddAssociationEx(aroModel) {
  return function addAssociationEx(submodelData, parent = null) {
    const resultArray = handleValueArrayForMethod(this, this.addAssociationEx, submodelData, parent);
    if (resultArray) return resultArray;
    let {
      model: submodelName,
      value,
      options = {}, // eslint-disable-line no-unused-vars
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
    const methodName = `add${capitalizeFirstLetter(submodel.asSingular)}`;

    return handlePromiseCallback(this[methodName](value, originalOptions), parent, callbackPromise)
      .then((result) => {
        let associationResult = result;
        while (Array.isArray(associationResult)) {
          associationResult = associationResult[0];
        }
        // console.log('associationResult :', associationResult);
        // console.log('submodel.throughName :', submodel.throughName);
        value.dataValues[submodel.throughName] = associationResult;
        if (submodel.isSingular) {
          this.dataValues[submodelName] = value;
        } else {
          this.dataValues[submodelName] = this.dataValues[submodelName] || [];
          this.dataValues[submodelName].push(value);
        }
        if (result && submodels) {
          const newParent = { result: this, associationResult: result, parent, inputData: submodelData };
          return value.addAssociationEx(submodels, newParent)
            .then(submodelResult => this);
        }
        return this;
      });
  };
}

