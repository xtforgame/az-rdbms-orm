/* eslint-disable no-param-reassign */

import {
  toUnderscore,
  defaultCallbackPromise,
  isFunction,
  handleValueArrayForMethod,
  handlePromiseCallback,
} from '../utils';

import AroQuery from './aro-query';

import genClassMethods from './class-methods';
import genInstanceMethods from './instance-methods';

function addMethods(tableOptions, aroModel) {
  const classMethods = genClassMethods(aroModel);
  tableOptions.classMethods = 'classMethods' in tableOptions ? tableOptions.classMethods : {};

  Object.assign(tableOptions.classMethods, classMethods);

  // tableOptions.getterMethods = {
  //   aroModel: function(){
  //     return aroModel;
  //   },
  // };

  const instanceMethods = genInstanceMethods(aroModel);
  tableOptions.instanceMethods = 'instanceMethods' in tableOptions ? tableOptions.instanceMethods : {};
  Object.assign(tableOptions.instanceMethods, instanceMethods);
}

function addMethodsForV4(table, aroModel) {
  const classMethods = genClassMethods(aroModel);
  Object.assign(table, classMethods);

  const instanceMethods = genInstanceMethods(aroModel);
  if(table.prototype) {
    Object.assign(table.prototype, instanceMethods);
  }
}

class AroSubmodel {
  constructor(owner, model, association) {
    this.owner = owner;
    this.model = model;
    this.association = association;

    this.names = model.names;
    this.asNames = association.options.as || this.names;
    this.name = null;

    this.through = this.association.options.through;
    if (this.through) {
      if (this.association.throughModel) {
        this.throughName = this.association.throughModel.tableName;
      } else {
        this.throughName = this.through;
      }
    }
    this.isSingular = this.association.isSingular;
    if (this.isSingular) {
      this.name = this.asNames.singular;
    } else {
      this.name = this.asNames.plural;
    }
  }

  get singular() {
    return this.names.singular;
  }

  get plural() {
    return this.names.plural;
  }

  get asSingular() {
    return this.asNames.singular;
  }

  get asPlural() {
    return this.asNames.plural;
  }
}

export default class AroModel {
  static availableAssociations = ['hasMany', 'belongsTo', 'belongsToMany'];

  constructor(azRdbmsOrm, modelName, tableDefine, tablePrefix = 'tbl_') {
    this.azRdbmsOrm = azRdbmsOrm;
    this.db = this.azRdbmsOrm.db;
    this.tableDefine = tableDefine;
    this.tablePrefix = tablePrefix;

    const { tableName, names, pLas, pAs, columns, tableOptions, associations } = this.getNormalizedSettings();

    const table = this.db.define(tableName, columns, tableOptions);

    this.primaryKey = null;
    this.columns = columns;

    const columnNames = Object.keys(this.columns);

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      if (this.columns[columnName].primaryKey) {
        this.primaryKey = columnName;
        break;
      }
    }

    this.modelName = modelName;
    this.names = names;
    this.tableName = tableName;
    this.pLas = pLas;
    this.pAs = pAs;
    this.associations = associations;
    this.table = table;
    addMethodsForV4(table, this);

    this.submodelMap = {};
  }

  getSubmodel(name) {
    return this.submodelMap[name];
  }

  createEx(submodelData, parent = null) {
    const resultArray = handleValueArrayForMethod(this, this.createEx, submodelData, parent);
    if (resultArray) return resultArray;
    let {
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

    return handlePromiseCallback(this.table.create(value, originalOptions), parent, callbackPromise)
      .then((result) => {
        if (result && submodels) {
          const newParent = { result, parent, inputData: submodelData };
          return result.createAssociationEx(submodels, newParent)
            .then((submodelResult) => {
              const resultDataValues = result.dataValues;
              submodels.forEach((modelInput, i) => {
                if (Array.isArray(submodelResult[i])) {
                  resultDataValues[modelInput.model] = resultDataValues[modelInput.model] || [];
                  resultDataValues[modelInput.model] = resultDataValues[modelInput.model].concat(submodelResult[i]);
                } else {
                  resultDataValues[modelInput.model] = submodelResult[i];
                }
              });
              return result;
            });
        }
        return result;
      });
  }

  getNormalizedSettings() {
    let { tableName, names, pLas, pAs, columns, tableOptions, associations } = this.tableDefine;
    tableName = tableName || (names && names.singular && `${this.tablePrefix}${toUnderscore(names.singular)}`);
    tableOptions.tableName = tableName;

    tableOptions.timestamps = 'timestamps' in tableOptions ? tableOptions.timestamps : true;
    tableOptions.paranoid = 'paranoid' in tableOptions ? tableOptions.paranoid : true;
    tableOptions.underscored = 'underscored' in tableOptions ? tableOptions.underscored : true;

    tableOptions.name = 'name' in tableOptions ? tableOptions.name : names;

    addMethods(tableOptions, this);
    return { tableName, names, pLas, pAs, columns, tableOptions, associations };
  }

  // ==============================================

  create(queryInput) {
    const query = new AroQuery(this, 'create', queryInput);
    return this.createEx(queryInput)
      .then((result) => {
        query.setOrigonalResult(result);
        return query;
      });
  }

  findOne(queryInput) {
    const query = new AroQuery(this, 'findOne', queryInput);
    const { originalOptions } = queryInput;
    const include = query.toInclude();
    return this.table.findOne({
      attributes: this.pAs,
      include,
      ...originalOptions,
    })
      .then((result) => {
        query.setOrigonalResult(result);
        return query;
      });
  }

  findAll(queryInput) {
    const query = new AroQuery(this, 'findAll', queryInput);
    const { originalOptions } = queryInput;
    const include = query.toInclude();
    return this.table.findAll({
      attributes: this.pLas || this.pAs,
      include,
      ...originalOptions,
    })
      .then((result) => {
        query.setOrigonalResult(result);
        return query;
      });
  }

  update(queryInput) {
    const query = new AroQuery(this, 'update', queryInput);
    const { value, originalOptions } = queryInput;
    return this.table.update(value, originalOptions)
      .then((result) => {
        query.setOrigonalResult(result);
        return query;
      });
  }

  destroy(queryInput) {
    const query = new AroQuery(this, 'destroy', queryInput);
    const { originalOptions } = queryInput;
    return this.table.destroy(originalOptions)
      .then((result) => {
        query.setOrigonalResult(result);
        return query;
      });
  }

  setupAssociations() {
    if (this.associations) {
      this.associations.forEach((association) => {
        const { target, type, options, originalOptions } = association;
        const squelSubmodel = this.azRdbmsOrm.getModel(target);
        const submodel = new AroSubmodel(this, squelSubmodel, association);
        this.submodelMap[submodel.name] = submodel;

        let targetTable = this.azRdbmsOrm.getModel(target);
        targetTable = targetTable && targetTable.table;
        if (this.constructor.availableAssociations.indexOf(type) !== -1) {
          if (type === 'hasMany') {
            const newOptions = { ...options };
            if (newOptions.as) {
              newOptions.as = newOptions.as.plural;
            }
            this.table[type](targetTable, Object.assign(newOptions, originalOptions || {}));
          } else if (type === 'belongsTo') {
            const newOptions = { ...options };
            if (newOptions.as) {
              newOptions.as = newOptions.as.singular;
            }
            this.table[type](targetTable, Object.assign(newOptions, originalOptions || {}));
          } else {
            this.table[type](targetTable, Object.assign({ ...options }, originalOptions || {}));
          }
        }
      });
    }
  }
}
