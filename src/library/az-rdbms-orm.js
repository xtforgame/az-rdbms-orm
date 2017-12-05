/* eslint-disable no-param-reassign */

import { toUnderscore } from './utils';
import DataModel from './data-model';
import AssociationTable from './association-table';

export default class AzRdbmsOrm {
  constructor(sequelizeDb, aroModelDefs) {
    this.db = sequelizeDb;
    this.aroModelDefs = aroModelDefs;
    this.tableInfo = {};
    this.associationTableInfo = {};

    const { models, associationTables, associations } = this.aroModelDefs;

    Object.keys(associationTables).map(name =>
      (this.associationTableInfo[name] = new AssociationTable(this, name, associationTables[name])));

    this.createAssociations(models, associations);

    Object.keys(models).map(name =>
      (this.tableInfo[name] = new DataModel(this, name, models[name])));

    Object.keys(this.tableInfo).map(name =>
      this.tableInfo[name].setupAssociations());
  }

  sync(force = true) {
    return this.db.sync({ force });
  }

  createAssociations(models, associations) {
    associations.forEach((association) => {
      const a = models[association.a.name];
      const b = models[association.b.name];
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
          originalOptions: association.a.originalOptions,
        });

        b.associations.push({
          type: 'belongsTo',
          isSingular: true,
          target: association.a.name,
          options: association.b.options,
          originalOptions: association.b.originalOptions,
        });
      } else if (association.type === 'belongsToMany') {
        let through = association.through || `mn_${toUnderscore(a.names.singular)}_${toUnderscore(b.names.singular)}`;
        let throughModel;
        if (typeof through !== 'string') {
          throughModel = this.getAssociationTable(through.model);
          through = { ...through, model: throughModel.table };
        }
        association.through = through;
        a.associations.push({
          type: 'belongsToMany',
          isSingular: false,
          throughModel,
          target: association.b.name,
          options: Object.assign({}, association.a.options || {}, {
            through,
            as: association.a.options.as || b.names,
            foreignKey: association.a.options.foreignKey || `${toUnderscore(a.names.singular)}_id`,
          }),
          originalOptions: association.a.originalOptions,
        });

        b.associations.push({
          type: 'belongsToMany',
          isSingular: false,
          throughModel,
          target: association.a.name,
          options: Object.assign({}, association.b.options || {}, {
            through,
            as: association.b.options.as || a.names,
            foreignKey: association.b.options.foreignKey || `${toUnderscore(b.names.singular)}_id`,
          }),
          originalOptions: association.b.originalOptions,
        });
      }
    });
  }

  getModel(name) {
    return this.tableInfo[name];
  }

  getAssociationTable(name) {
    return this.associationTableInfo[name];
  }
}
