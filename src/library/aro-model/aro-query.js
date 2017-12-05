/* eslint-disable no-param-reassign */

// import write from '../../utils/write-file';
import jsonPointer from 'json-pointer'; // may only use "compile" and "parse"

const removeTimestamps = (obj) => {
  delete obj.created_at;
  delete obj.deleted_at;
  delete obj.updated_at;
  return obj;
};

const normalizeModelInput = _modelInput =>
  ((typeof _modelInput !== 'string') ? { ..._modelInput } : { model: _modelInput });

const parseQueryOptions = (aroModel, _modelInput) => {
  let {
    model,
    includeAssociation,
    submodels: _submodels,
    ...rest
  } = normalizeModelInput(_modelInput);

  let submodel;
  if (model) {
    submodel = aroModel.getSubmodel(model);
    if (typeof includeAssociation === 'string') {
      includeAssociation = { name: includeAssociation };
    } else if (includeAssociation && typeof includeAssociation !== 'object') {
      includeAssociation = { name: submodel.throughName };
    }
  }

  let submodels = _submodels && _submodels.map(normalizeModelInput);
  const submodelNames = _submodels && submodels.map(m => m.model);

  if (submodels) {
    submodels = submodels.map((_submodel) => {
      if (!model) {
        return parseQueryOptions(aroModel, _submodel);
      }
      return parseQueryOptions(submodel.model || aroModel, _submodel);
    });
  }

  return {
    model,
    includeAssociation,
    submodel,
    submodels,
    submodelNames,
    _parsed: true,
    ...rest,
  };
};

const submodelsToInclude = (aroModel, submodelInputs) => submodelInputs.map((submodelInput) => {
  const { submodel, submodels, originalOptions } = parseQueryOptions(aroModel, submodelInput);
  const result = {
    model: submodel.model.table,
    as: submodel.name,
    attributes: submodel.model.pAs,
    ...originalOptions,
  };

  if (submodels) {
    result.include = submodelsToInclude(submodel.model, submodels);
  }
  return result;
});

const getIndent = (level) => {
  let indent = '';
  for (let i = 0; i < level; i++) {
    indent += '  ';
  }
  return indent;
};

class QueryResultNode {
  constructor(query, resultInLevel, optionsInLevel, parent = null) {
    this.query = query;
    this.resultInLevel = resultInLevel;
    this.optionsInLevel = optionsInLevel;
    this.parent = parent;

    this.asName = this.optionsInLevel.model;
    this.modelName = this.optionsInLevel.submodel && this.optionsInLevel.submodel.model.modelName;
  }

  get rows() {
    if (Array.isArray(this.resultInLevel)) {
      return this.resultInLevel;
    }
    return this.resultInLevel ? [this.resultInLevel] : [];
  }

  get rowOrRows() {
    if (Array.isArray(this.resultInLevel)) {
      return this.resultInLevel;
    }
    return this.resultInLevel;
  }

  getChildren(row) {
    const { submodels } = this.optionsInLevel;
    if (submodels) {
      return submodels.map(submodel => new QueryResultNode(this.query, row.dataValues[submodel.model], submodel, this));
    }
    return [];
  }

  getNodeByPath(path) {
    const pathArray = jsonPointer.parse(path);
    let currentNode = this;
    let currentChildren = null;
    let rowOrRows = this.rowOrRows;

    const getSubmodelFromChildren = (children, pathSeg) => {
      let node = null;
      for (let i = 0; i < children.length; i++) {
        if (children[i].optionsInLevel.model === pathSeg) {
          node = children[i];
          break;
        }
      }
      if (!node) {
        throw new Error(`Wrong Path: ${path} in (${pathSeg})`);
      }
      return node;
    };

    pathArray.forEach((pathSeg) => {
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
          throw new Error(`Wrong Path: ${path} in (${pathSeg})`);
        }
        currentNode = getSubmodelFromChildren(currentChildren, pathSeg);
        rowOrRows = currentNode.rowOrRows;
        currentChildren = null;
      }
    });
    return currentNode || currentChildren;
  }

  createNormalizedResult(options = {}) {
    const { submodel, submodelNames, includeAssociation } = this.optionsInLevel;
    const parseRow = (row) => {
      if (row.dataValues) {
        const retval = { ...row.dataValues };
        if (submodelNames) {
          submodelNames.forEach((name) => { delete retval[name]; });
        }

        removeTimestamps(retval);
        if (submodel && submodel.throughName) {
          if (includeAssociation) {
            const associationResult = { ...retval[submodel.throughName].dataValues };
            removeTimestamps(associationResult);
            delete retval[submodel.throughName];
            retval[includeAssociation.name] = associationResult;
            if (includeAssociation.attrs) {
              const assocAttrs = {};
              includeAssociation.attrs.forEach((attr) => {
                assocAttrs[attr] = associationResult[attr];
              });
              retval[includeAssociation.name] = assocAttrs;
            }
          } else {
            delete retval[submodel.throughName];
          }
        }
        let submodelMapObj = retval;
        if (options.submodelMapName) {
          retval[options.submodelMapName] = retval[options.submodelMapName] || {};
          submodelMapObj = retval[options.submodelMapName];
        }
        this.getChildren(row).forEach((newNode) => {
          submodelMapObj[newNode.asName] = newNode.createNormalizedResult(options);
        });
        return retval;
      }
      return {};
    };
    const rowOrRows = this.rowOrRows;
    if (!rowOrRows) {
      return rowOrRows;
    }
    if (!Array.isArray(rowOrRows)) {
      return parseRow(rowOrRows);
    }
    return rowOrRows.map(parseRow);
  }

  toPublic(options) {
    return this.createNormalizedResult(options);
  }
}

export default class AroQuery {
  constructor(model, queryType, queryInput) {
    this.model = model;
    this.queryType = queryType;
    this.queryInput = queryInput;
    this.options = this.queryInput.options;
    this.parsedOptions = parseQueryOptions(this.model, this.options);
    this.origonalResult = null;
  }

  toInclude() {
    let include;
    const { submodels } = this.options;
    if (submodels) {
      include = submodelsToInclude(this.model, submodels);
    }
    return include;
  }

  getResultRows() {
    if (this.queryType === 'update') {
      return this.origonalResult[1];
    } else if (this.queryType === 'destroy') {
      return [];
    }
    return this.origonalResult;
  }

  getRootNode() {
    return new QueryResultNode(this, this.getResultRows(), this.parsedOptions, null);
  }

  // =============================================
  setOrigonalResult(origonalResult) {
    this.origonalResult = origonalResult;
    if (this.queryType === 'update') {
      this.affectedRows = this.origonalResult[0];
    } else if (this.queryType === 'destroy') {
      this.affectedRows = this.origonalResult;
    }

    // this.reportResult();
    // this.result = this.getRootNode().createNormalizedResult();
    // write('./query-debug.log', JSON.stringify(this.result, null, 2));
  }

  toPublic(options) {
    return this.getRootNode().toPublic(options);
  }

  toPublic2(options = { submodelMapName: '_submodelMap' }) {
    return this.getRootNode().toPublic(options);
  }

  // ==================================================================
  reportResultLevel(node, level = 0) {
    const indent = getIndent(level);
    const { submodelNames, includeAssociation } = node.optionsInLevel;
    if (node.modelName) {
      console.log(`${indent}model.name :`, node.modelName);
    }

    if (node.asName) {
      console.log(`${indent}As :`, node.asName);
    }

    if (submodelNames) {
      console.log(`${indent}Submodels :[${submodelNames.join(', ')}]`);
    }

    return node.rows.map((row) => {
      if (row.dataValues) {
        const dataValueKeys = Object.keys(row.dataValues);
        console.log(`${indent}DataValueKeys :`, dataValueKeys.join(', '));
        console.log(`${indent}IncludeAssociation :`, includeAssociation);
        return node.getChildren(row).map(newNode => this.reportResultLevel(newNode, level + 1));
      }
      return null;
    });
  }

  reportResult() {
    console.log('===================================');
    console.log('QueryType :', this.queryType);
    console.log('');
    console.log('This model :', this.model.modelName);
    const resultRows = this.reportResultLevel(this.getRootNode());
    console.log('===================================');
    return resultRows;
  }
}
