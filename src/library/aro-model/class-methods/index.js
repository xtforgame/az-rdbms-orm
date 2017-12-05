import {
  genBulkCreateEx,
  genBulkCreateExx,
} from './bulkCreateEx';

export default function genClassMethods(aroModel) {
  return {
    bulkCreateEx: genBulkCreateEx(aroModel),
    bulkCreateExx: genBulkCreateExx(aroModel),
  };
}
