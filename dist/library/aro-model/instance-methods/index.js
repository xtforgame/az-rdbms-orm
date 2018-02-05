'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = genInstanceMethods;

var _createAssociationEx = require('./createAssociationEx');

var _createAssociationEx2 = _interopRequireDefault(_createAssociationEx);

var _addAssociationEx = require('./addAssociationEx');

var _addAssociationEx2 = _interopRequireDefault(_addAssociationEx);

var _setAssociationEx = require('./setAssociationEx');

var _setAssociationEx2 = _interopRequireDefault(_setAssociationEx);

var _getAroModel = require('./getAroModel');

var _getAroModel2 = _interopRequireDefault(_getAroModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function genInstanceMethods(aroModel) {
  return {
    createAssociationEx: (0, _createAssociationEx2.default)(aroModel),
    addAssociationEx: (0, _addAssociationEx2.default)(aroModel),
    setAssociationEx: (0, _setAssociationEx2.default)(aroModel),
    getAroModel: (0, _getAroModel2.default)(aroModel)
  };
}