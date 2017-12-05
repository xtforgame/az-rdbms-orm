'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _jsonPointer = require('json-pointer');

var _jsonPointer2 = _interopRequireDefault(_jsonPointer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var removeTimestamps = function removeTimestamps(obj) {
  delete obj.created_at;
  delete obj.deleted_at;
  delete obj.updated_at;
  return obj;
};

var normalizeModelInput = function normalizeModelInput(_modelInput) {
  return typeof _modelInput !== 'string' ? _extends({}, _modelInput) : { model: _modelInput };
};

var parseQueryOptions = function parseQueryOptions(aroModel, _modelInput) {
  var _normalizeModelInput = normalizeModelInput(_modelInput),
      model = _normalizeModelInput.model,
      includeAssociation = _normalizeModelInput.includeAssociation,
      _submodels = _normalizeModelInput.submodels,
      rest = _objectWithoutProperties(_normalizeModelInput, ['model', 'includeAssociation', 'submodels']);

  var submodel = void 0;
  if (model) {
    submodel = aroModel.getSubmodel(model);
    if (typeof includeAssociation === 'string') {
      includeAssociation = { name: includeAssociation };
    } else if (includeAssociation && (typeof includeAssociation === 'undefined' ? 'undefined' : _typeof(includeAssociation)) !== 'object') {
      includeAssociation = { name: submodel.throughName };
    }
  }

  var submodels = _submodels && _submodels.map(normalizeModelInput);
  var submodelNames = _submodels && submodels.map(function (m) {
    return m.model;
  });

  if (submodels) {
    submodels = submodels.map(function (_submodel) {
      if (!model) {
        return parseQueryOptions(aroModel, _submodel);
      }
      return parseQueryOptions(submodel.model || aroModel, _submodel);
    });
  }

  return _extends({
    model: model,
    includeAssociation: includeAssociation,
    submodel: submodel,
    submodels: submodels,
    submodelNames: submodelNames,
    _parsed: true
  }, rest);
};

var submodelsToInclude = function submodelsToInclude(aroModel, submodelInputs) {
  return submodelInputs.map(function (submodelInput) {
    var _parseQueryOptions = parseQueryOptions(aroModel, submodelInput),
        submodel = _parseQueryOptions.submodel,
        submodels = _parseQueryOptions.submodels,
        originalOptions = _parseQueryOptions.originalOptions;

    var result = _extends({
      model: submodel.model.table,
      as: submodel.name,
      attributes: submodel.model.pAs
    }, originalOptions);

    if (submodels) {
      result.include = submodelsToInclude(submodel.model, submodels);
    }
    return result;
  });
};

var getIndent = function getIndent(level) {
  var indent = '';
  for (var i = 0; i < level; i++) {
    indent += '  ';
  }
  return indent;
};

var QueryResultNode = function () {
  function QueryResultNode(query, resultInLevel, optionsInLevel) {
    var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    _classCallCheck(this, QueryResultNode);

    this.query = query;
    this.resultInLevel = resultInLevel;
    this.optionsInLevel = optionsInLevel;
    this.parent = parent;

    this.asName = this.optionsInLevel.model;
    this.modelName = this.optionsInLevel.submodel && this.optionsInLevel.submodel.model.modelName;
  }

  _createClass(QueryResultNode, [{
    key: 'getChildren',
    value: function getChildren(row) {
      var _this = this;

      var submodels = this.optionsInLevel.submodels;

      if (submodels) {
        return submodels.map(function (submodel) {
          return new QueryResultNode(_this.query, row.dataValues[submodel.model], submodel, _this);
        });
      }
      return [];
    }
  }, {
    key: 'getNodeByPath',
    value: function getNodeByPath(path) {
      var pathArray = _jsonPointer2.default.parse(path);
      var currentNode = this;
      var currentChildren = null;
      var rowOrRows = this.rowOrRows;

      var getSubmodelFromChildren = function getSubmodelFromChildren(children, pathSeg) {
        var node = null;
        for (var i = 0; i < children.length; i++) {
          if (children[i].optionsInLevel.model === pathSeg) {
            node = children[i];
            break;
          }
        }
        if (!node) {
          throw new Error('Wrong Path: ' + path + ' in (' + pathSeg + ')');
        }
        return node;
      };

      pathArray.forEach(function (pathSeg) {
        if (currentNode && Array.isArray(rowOrRows)) {
          currentChildren = currentNode.getChildren(rowOrRows[pathSeg]);
          rowOrRows = null;
          currentNode = null;
        } else if (currentNode) {
          currentChildren = currentNode.getChildren(rowOrRows);
          currentNode = getSubmodelFromChildren(currentChildren, pathSeg);
          rowOrRows = currentNode.rowOrRows;
          currentChildren = null;
        } else {
          if (!currentChildren) {
            throw new Error('Wrong Path: ' + path + ' in (' + pathSeg + ')');
          }
          currentNode = getSubmodelFromChildren(currentChildren, pathSeg);
          rowOrRows = currentNode.rowOrRows;
          currentChildren = null;
        }
      });
      return currentNode || currentChildren;
    }
  }, {
    key: 'createNormalizedResult',
    value: function createNormalizedResult() {
      var _this2 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var _optionsInLevel = this.optionsInLevel,
          submodel = _optionsInLevel.submodel,
          submodelNames = _optionsInLevel.submodelNames,
          includeAssociation = _optionsInLevel.includeAssociation;

      var parseRow = function parseRow(row) {
        if (row.dataValues) {
          var retval = _extends({}, row.dataValues);
          if (submodelNames) {
            submodelNames.forEach(function (name) {
              delete retval[name];
            });
          }

          removeTimestamps(retval);
          if (submodel && submodel.throughName) {
            if (includeAssociation) {
              var associationResult = _extends({}, retval[submodel.throughName].dataValues);
              removeTimestamps(associationResult);
              delete retval[submodel.throughName];
              retval[includeAssociation.name] = associationResult;
              if (includeAssociation.attrs) {
                var assocAttrs = {};
                includeAssociation.attrs.forEach(function (attr) {
                  assocAttrs[attr] = associationResult[attr];
                });
                retval[includeAssociation.name] = assocAttrs;
              }
            } else {
              delete retval[submodel.throughName];
            }
          }
          var submodelMapObj = retval;
          if (options.submodelMapName) {
            retval[options.submodelMapName] = retval[options.submodelMapName] || {};
            submodelMapObj = retval[options.submodelMapName];
          }
          _this2.getChildren(row).forEach(function (newNode) {
            submodelMapObj[newNode.asName] = newNode.createNormalizedResult(options);
          });
          return retval;
        }
        return {};
      };
      var rowOrRows = this.rowOrRows;
      if (!rowOrRows) {
        return rowOrRows;
      }
      if (!Array.isArray(rowOrRows)) {
        return parseRow(rowOrRows);
      }
      return rowOrRows.map(parseRow);
    }
  }, {
    key: 'toPublic',
    value: function toPublic(options) {
      return this.createNormalizedResult(options);
    }
  }, {
    key: 'rows',
    get: function get() {
      if (Array.isArray(this.resultInLevel)) {
        return this.resultInLevel;
      }
      return this.resultInLevel ? [this.resultInLevel] : [];
    }
  }, {
    key: 'rowOrRows',
    get: function get() {
      if (Array.isArray(this.resultInLevel)) {
        return this.resultInLevel;
      }
      return this.resultInLevel;
    }
  }]);

  return QueryResultNode;
}();

var AroQuery = function () {
  function AroQuery(model, queryType, queryInput) {
    _classCallCheck(this, AroQuery);

    this.model = model;
    this.queryType = queryType;
    this.queryInput = queryInput;
    this.options = this.queryInput.options;
    this.parsedOptions = parseQueryOptions(this.model, this.options);
    this.origonalResult = null;
  }

  _createClass(AroQuery, [{
    key: 'toInclude',
    value: function toInclude() {
      var include = void 0;
      var submodels = this.options.submodels;

      if (submodels) {
        include = submodelsToInclude(this.model, submodels);
      }
      return include;
    }
  }, {
    key: 'getResultRows',
    value: function getResultRows() {
      if (this.queryType === 'update') {
        return this.origonalResult[1];
      } else if (this.queryType === 'destroy') {
        return [];
      }
      return this.origonalResult;
    }
  }, {
    key: 'getRootNode',
    value: function getRootNode() {
      return new QueryResultNode(this, this.getResultRows(), this.parsedOptions, null);
    }
  }, {
    key: 'setOrigonalResult',
    value: function setOrigonalResult(origonalResult) {
      this.origonalResult = origonalResult;
      if (this.queryType === 'update') {
        this.affectedRows = this.origonalResult[0];
      } else if (this.queryType === 'destroy') {
        this.affectedRows = this.origonalResult;
      }
    }
  }, {
    key: 'toPublic',
    value: function toPublic(options) {
      return this.getRootNode().toPublic(options);
    }
  }, {
    key: 'toPublic2',
    value: function toPublic2() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { submodelMapName: '_submodelMap' };

      return this.getRootNode().toPublic(options);
    }
  }, {
    key: 'reportResultLevel',
    value: function reportResultLevel(node) {
      var _this3 = this;

      var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      var indent = getIndent(level);
      var _node$optionsInLevel = node.optionsInLevel,
          submodelNames = _node$optionsInLevel.submodelNames,
          includeAssociation = _node$optionsInLevel.includeAssociation;

      if (node.modelName) {
        console.log(indent + 'model.name :', node.modelName);
      }

      if (node.asName) {
        console.log(indent + 'As :', node.asName);
      }

      if (submodelNames) {
        console.log(indent + 'Submodels :[' + submodelNames.join(', ') + ']');
      }

      return node.rows.map(function (row) {
        if (row.dataValues) {
          var dataValueKeys = Object.keys(row.dataValues);
          console.log(indent + 'DataValueKeys :', dataValueKeys.join(', '));
          console.log(indent + 'IncludeAssociation :', includeAssociation);
          return node.getChildren(row).map(function (newNode) {
            return _this3.reportResultLevel(newNode, level + 1);
          });
        }
        return null;
      });
    }
  }, {
    key: 'reportResult',
    value: function reportResult() {
      console.log('===================================');
      console.log('QueryType :', this.queryType);
      console.log('');
      console.log('This model :', this.model.modelName);
      var resultRows = this.reportResultLevel(this.getRootNode());
      console.log('===================================');
      return resultRows;
    }
  }]);

  return AroQuery;
}();

exports.default = AroQuery;