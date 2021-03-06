/*eslint-disable no-unused-vars, no-undef */

import chai from 'chai';
import Sequelize from 'sequelize';
import AzRdbmsOrm from '../../src/library/az-rdbms-orm';

import {
  postgresPort,
  postgresUser,
  postgresDbName,
  postgresPassword,
  postgresHost,
  getConnectString,
  resetTestDbAndTestRole,
} from '../test-utils/sequelize-utils';

import {getAroModelDefs02} from '../test-data/az-rdbms-orm.testdata';
import fs from 'fs';
import path from 'path';
let logFiles = {};

let write = (file, data) => {
  let logFile = logFiles[file] = logFiles[file] || fs.createWriteStream(file, {flags : 'w'});
  logFile.write(data);
}

export default write;


function databaseLogger(...args){ // eslint-disable-line no-unused-vars
  write(path.resolve(__dirname, './az-rdbms-orm-002.spec.log'), args[0] + '\n');
}

let expect = chai.expect;

class AzRdbmsMgr {
  constructor(aroModelDefs){
    this.aroModelDefs = aroModelDefs;
    this.sequelizeDb = new Sequelize(getConnectString(postgresUser), {
      'dialect': 'postgres',
      'logging': databaseLogger,
    });

    this.azRdbmsOrm = new AzRdbmsOrm(this.sequelizeDb, this.aroModelDefs);
  }

  sync(force = true){
    return this.azRdbmsOrm.sync({force});
  }
}

describe('AzRdbmsOrm test', function(){

  describe('Basic', function(){
    beforeEach(function() {
      return resetTestDbAndTestRole();
    });


    it('should able to create', function(){
      this.timeout(900000);
      let azRdbmsMgr = new AzRdbmsMgr(getAroModelDefs02());
      return azRdbmsMgr.sync()
      .then(() => {
        let users = azRdbmsMgr.azRdbmsOrm.getModel('users');
        return azRdbmsMgr.sequelizeDb.transaction({
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        })
        .then(t => {
          return users.create({
            value: {
              username: 'xxxxx',
            },
            originalOptions: {
              transaction: t,
            },
            submodels: [
              {
                model: 'accountLinks',
                value: ({parent: {result: user}}) => {
                  return {
                    provider_id: 'vaxal',
                    provider_user_id: user.dataValues.username,
                    provider_user_access_info: {
                      password: user.dataValues.username,
                    },
                  };
                },
                originalOptions: {
                  transaction: t,
                },
              },
            ],
          })
          .then(result => {
            return t.commit()
            .then(() => result);
          }).catch(error => {
            console.log(error);
            return t.rollback()
            .then(() => Promise.reject(error));
          });
        })
        .then(user => {
          expect(user.origonalResult, 'user.origonalResult').to.be.an('object');
          let squelUserInst = user.origonalResult;
          expect(squelUserInst.dataValues, 'squelUserInst.dataValues').to.be.an('object');
          expect(squelUserInst.dataValues.username, 'squelUserInst.dataValues.username').to.equal('xxxxx');
          expect(squelUserInst.dataValues.accountLinks, 'squelUserInst.accountLinks').to.exist;
          expect(squelUserInst.dataValues.accountLinks[0], 'squelUserInst.accountLinks[0]').to.be.an('object');
          let squelAccountLinkInst = squelUserInst.dataValues.accountLinks[0];
          expect(squelAccountLinkInst.dataValues.provider_user_id, 'squelAccountLinkInst.dataValues.provider_user_id').to.equal('xxxxx');
        });
      });
    });
  });

});
