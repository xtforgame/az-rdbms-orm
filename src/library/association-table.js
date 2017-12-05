import AroModel from './aro-model';

export default class AssociationTable extends AroModel {
  constructor(azRdbmsOrm, key, tableDefine) {
    super(azRdbmsOrm, key, tableDefine, 'mn_');
  }
}
