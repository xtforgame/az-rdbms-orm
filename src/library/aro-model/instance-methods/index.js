import genCreateAssociationEx from './createAssociationEx';
import genAddAssociationEx from './addAssociationEx';
import genGetAroModel from './getAroModel';

export default function genInstanceMethods(aroModel) {
  return {
    createAssociationEx: genCreateAssociationEx(aroModel),
    addAssociationEx: genAddAssociationEx(aroModel),
    getAroModel: genGetAroModel(aroModel),
  };
}
