import {
  toSeqPromise,
} from '../../utils';

export function genBulkCreateEx(aroModel) {
  return function bulkCreateEx(array) {
    const allPromise = [];
    return aroModel.db.transaction(t => toSeqPromise(array, (_, item) => {
      const p = this.create(item, { transaction: t });
      allPromise.push(p);
      return p;
    }))
      .then(() => Promise.all(allPromise));
  };
}

export function genBulkCreateExx(aroModel) {
  return function bulkCreateExx(array) {
    return Promise.all(array.map(item => this.create(item)));
  };
}
