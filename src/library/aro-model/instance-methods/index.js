import genCreateAssociationEx from './createAssociationEx';
import genAddAssociationEx from './addAssociationEx';
import genSetAssociationEx from './setAssociationEx';
import genGetAroModel from './getAroModel';

export default function genInstanceMethods(aroModel) {
  return {
    createAssociationEx: genCreateAssociationEx(aroModel),
    addAssociationEx: genAddAssociationEx(aroModel),
    setAssociationEx: genSetAssociationEx(aroModel),
    getAroModel: genGetAroModel(aroModel),
  };
}
