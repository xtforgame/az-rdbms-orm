'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _dataModel = require('./data-model');

var _dataModel2 = _interopRequireDefault(_dataModel);

var _associationTable = require('./association-table');

var _associationTable2 = _interopRequireDefault(_associationTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AzRdbmsOrm = function () {
  function AzRdbmsOrm(sequelizeDb, aroModelDefs) {
    var _this = this;

    _classCallCheck(this, AzRdbmsOrm);

    this.db = sequelizeDb;
    this.aroModelDefs = aroModelDefs;
    this.tableInfo = {};
    this.associationTableInfo = {};

    var _aroModelDefs = this.aroModelDefs,
        models = _aroModelDefs.models,
        associationTables = _aroModelDefs.associationTables,
        associations = _aroModelDefs.associations;


    Object.keys(associationTables).map(function (name) {
      return _this.associationTableInfo[name] = new _associationTable2.default(_this, name, associationTables[name]);
    });

    this.createAssociations(models, associations);

    Object.keys(models).map(function (name) {
      return _this.tableInfo[name] = new _dataModel2.default(_this, name, models[name]);
    });

    Object.keys(this.tableInfo).map(function (name) {
      return _this.tableInfo[name].setupAssociations();
    });
  }

  _createClass(AzRdbmsOrm, [{
    key: 'sync',
    value: function sync() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      return this.db.sync({ force: force });
    }
  }, {
    key: 'createAssociations',
    value: function createAssociations(models, associations) {
      var _this2 = this;

      associations.forEach(function (association) {
        var a = models[association.a.name];
        var b = models[association.b.name];
        a.associations = a.associations || [];
        b.associations = b.associations || [];

        association.a.options = association.a.options || {};
        association.b.options = association.b.options || {};

        if (association.type === 'hasMany') {
          a.associations.push({
            type: 'hasMany',
            isSingular: false,
            target: association.b.name,
            options: association.a.options,
            originalOptions: association.a.originalOptions
          });

          b.associations.push({
            type: 'belongsTo',
            isSingular: true,
            target: association.a.name,
            options: association.b.options,
            originalOptions: association.b.originalOptions
          });
        } else if (association.type === 'belongsToMany') {
          var through = association.through || 'mn_' + (0, _utils.toUnderscore)(a.names.singular) + '_' + (0, _utils.toUnderscore)(b.names.singular);
          var throughModel = void 0;
          if (typeof through !== 'string') {
            throughModel = _this2.getAssociationTable(through.model);
            through = _extends({}, through, { model: throughModel.table });
          }
          association.through = through;
          a.associations.push({
            type: 'belongsToMany',
            isSingular: false,
            throughModel: throughModel,
            target: association.b.name,
            options: Object.assign({}, association.a.options || {}, {
              through: through,
              as: association.a.options.as || b.names,
              foreignKey: association.a.options.foreignKey || (0, _utils.toUnderscore)(a.names.singular) + '_id'
            }),
            originalOptions: association.a.originalOptions
          });

          b.associations.push({
            type: 'belongsToMany',
            isSingular: false,
            throughModel: throughModel,
            target: association.a.name,
            options: Object.assign({}, association.b.options || {}, {
              through: through,
              as: association.b.options.as || a.names,
              foreignKey: association.b.options.foreignKey || (0, _utils.toUnderscore)(b.names.singular) + '_id'
            }),
            originalOptions: association.b.originalOptions
          });
        }
      });
    }
  }, {
    key: 'getModel',
    value: function getModel(name) {
      return this.tableInfo[name];
    }
  }, {
    key: 'getAssociationTable',
    value: function getAssociationTable(name) {
      return this.associationTableInfo[name];
    }
  }]);

  return AzRdbmsOrm;
}();

exports.default = AzRdbmsOrm;