'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _aroQuery = require('./aro-query');

var _aroQuery2 = _interopRequireDefault(_aroQuery);

var _classMethods = require('./class-methods');

var _classMethods2 = _interopRequireDefault(_classMethods);

var _instanceMethods = require('./instance-methods');

var _instanceMethods2 = _interopRequireDefault(_instanceMethods);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function addMethods(tableOptions, aroModel) {
  var classMethods = (0, _classMethods2.default)(aroModel);
  tableOptions.classMethods = 'classMethods' in tableOptions ? tableOptions.classMethods : {};

  Object.assign(tableOptions.classMethods, classMethods);

  var instanceMethods = (0, _instanceMethods2.default)(aroModel);
  tableOptions.instanceMethods = 'instanceMethods' in tableOptions ? tableOptions.instanceMethods : {};
  Object.assign(tableOptions.instanceMethods, instanceMethods);
}

function addMethodsForV4(table, aroModel) {
  var classMethods = (0, _classMethods2.default)(aroModel);
  Object.assign(table, classMethods);

  var instanceMethods = (0, _instanceMethods2.default)(aroModel);
  if (table.prototype) {
    Object.assign(table.prototype, instanceMethods);
  }
}

var AroSubmodel = function () {
  function AroSubmodel(owner, model, association) {
    _classCallCheck(this, AroSubmodel);

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

  _createClass(AroSubmodel, [{
    key: 'singular',
    get: function get() {
      return this.names.singular;
    }
  }, {
    key: 'plural',
    get: function get() {
      return this.names.plural;
    }
  }, {
    key: 'asSingular',
    get: function get() {
      return this.asNames.singular;
    }
  }, {
    key: 'asPlural',
    get: function get() {
      return this.asNames.plural;
    }
  }]);

  return AroSubmodel;
}();

var AroModel = (_temp = _class = function () {
  function AroModel(azRdbmsOrm, modelName, tableDefine) {
    var tablePrefix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'tbl_';

    _classCallCheck(this, AroModel);

    this.azRdbmsOrm = azRdbmsOrm;
    this.db = this.azRdbmsOrm.db;
    this.tableDefine = tableDefine;
    this.tablePrefix = tablePrefix;

    var _getNormalizedSetting = this.getNormalizedSettings(),
        tableName = _getNormalizedSetting.tableName,
        names = _getNormalizedSetting.names,
        pLas = _getNormalizedSetting.pLas,
        pAs = _getNormalizedSetting.pAs,
        columns = _getNormalizedSetting.columns,
        tableOptions = _getNormalizedSetting.tableOptions,
        associations = _getNormalizedSetting.associations;

    var table = this.db.define(tableName, columns, tableOptions);

    this.primaryKey = null;
    this.columns = columns;

    var columnNames = Object.keys(this.columns);

    for (var i = 0; i < columnNames.length; i++) {
      var columnName = columnNames[i];
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

  _createClass(AroModel, [{
    key: 'getSubmodel',
    value: function getSubmodel(name) {
      return this.submodelMap[name];
    }
  }, {
    key: 'createEx',
    value: function createEx(submodelData) {
      var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var resultArray = (0, _utils.handleValueArrayForMethod)(this, this.createEx, submodelData, parent);
      if (resultArray) return resultArray;
      var value = submodelData.value,
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

      return (0, _utils.handlePromiseCallback)(this.table.create(value, originalOptions), parent, callbackPromise).then(function (result) {
        if (result && submodels) {
          var newParent = { result: result, parent: parent, inputData: submodelData };
          return result.createAssociationEx(submodels, newParent).then(function (submodelResult) {
            var resultDataValues = result.dataValues;
            submodels.forEach(function (modelInput, i) {
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
  }, {
    key: 'getNormalizedSettings',
    value: function getNormalizedSettings() {
      var _tableDefine = this.tableDefine,
          tableName = _tableDefine.tableName,
          names = _tableDefine.names,
          pLas = _tableDefine.pLas,
          pAs = _tableDefine.pAs,
          columns = _tableDefine.columns,
          tableOptions = _tableDefine.tableOptions,
          associations = _tableDefine.associations;

      tableName = tableName || names && names.singular && '' + this.tablePrefix + (0, _utils.toUnderscore)(names.singular);
      tableOptions.tableName = tableName;

      tableOptions.timestamps = 'timestamps' in tableOptions ? tableOptions.timestamps : true;
      tableOptions.paranoid = 'paranoid' in tableOptions ? tableOptions.paranoid : true;
      tableOptions.underscored = 'underscored' in tableOptions ? tableOptions.underscored : true;

      tableOptions.name = 'name' in tableOptions ? tableOptions.name : names;

      addMethods(tableOptions, this);
      return { tableName: tableName, names: names, pLas: pLas, pAs: pAs, columns: columns, tableOptions: tableOptions, associations: associations };
    }
  }, {
    key: 'create',
    value: function create(queryInput) {
      var query = new _aroQuery2.default(this, 'create', queryInput);
      return this.createEx(queryInput).then(function (result) {
        query.setOrigonalResult(result);
        return query;
      });
    }
  }, {
    key: 'findOne',
    value: function findOne(queryInput) {
      var query = new _aroQuery2.default(this, 'findOne', queryInput);
      var originalOptions = queryInput.originalOptions;

      var include = query.toInclude();
      return this.table.findOne(_extends({
        attributes: this.pAs,
        include: include
      }, originalOptions)).then(function (result) {
        query.setOrigonalResult(result);
        return query;
      });
    }
  }, {
    key: 'findAll',
    value: function findAll(queryInput) {
      var query = new _aroQuery2.default(this, 'findAll', queryInput);
      var originalOptions = queryInput.originalOptions;

      var include = query.toInclude();
      return this.table.findAll(_extends({
        attributes: this.pLas || this.pAs,
        include: include
      }, originalOptions)).then(function (result) {
        query.setOrigonalResult(result);
        return query;
      });
    }
  }, {
    key: 'update',
    value: function update(queryInput) {
      var query = new _aroQuery2.default(this, 'update', queryInput);
      var value = queryInput.value,
          originalOptions = queryInput.originalOptions;

      return this.table.update(value, originalOptions).then(function (result) {
        query.setOrigonalResult(result);
        return query;
      });
    }
  }, {
    key: 'destroy',
    value: function destroy(queryInput) {
      var query = new _aroQuery2.default(this, 'destroy', queryInput);
      var originalOptions = queryInput.originalOptions;

      return this.table.destroy(originalOptions).then(function (result) {
        query.setOrigonalResult(result);
        return query;
      });
    }
  }, {
    key: 'setupAssociations',
    value: function setupAssociations() {
      var _this = this;

      if (this.associations) {
        this.associations.forEach(function (association) {
          var target = association.target,
              type = association.type,
              options = association.options,
              originalOptions = association.originalOptions;

          var squelSubmodel = _this.azRdbmsOrm.getModel(target);
          var submodel = new AroSubmodel(_this, squelSubmodel, association);
          _this.submodelMap[submodel.name] = submodel;

          var targetTable = _this.azRdbmsOrm.getModel(target);
          targetTable = targetTable && targetTable.table;
          if (_this.constructor.availableAssociations.indexOf(type) !== -1) {
            if (type === 'hasMany') {
              var newOptions = _extends({}, options);
              if (newOptions.as) {
                newOptions.as = newOptions.as.plural;
              }
              _this.table[type](targetTable, Object.assign(newOptions, originalOptions || {}));
            } else if (type === 'belongsTo') {
              var _newOptions = _extends({}, options);
              if (_newOptions.as) {
                _newOptions.as = _newOptions.as.singular;
              }
              _this.table[type](targetTable, Object.assign(_newOptions, originalOptions || {}));
            } else {
              _this.table[type](targetTable, Object.assign(_extends({}, options), originalOptions || {}));
            }
          }
        });
      }
    }
  }]);

  return AroModel;
}(), _class.availableAssociations = ['hasMany', 'belongsTo', 'belongsToMany'], _temp);
exports.default = AroModel;