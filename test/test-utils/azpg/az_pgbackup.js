import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
//import iconv from 'iconv-lite';

var system_encoding = 'utf8';
var pg_password = 'xxxx1234';

var pg_dump_args = ' --host 127.0.0.1 --port 5432 --username "postgres" --format tar --blobs --create --clean --section pre-data --section data --section post-data --encoding UTF8 --inserts --verbose --file ".\\db_rick_data.backup.tar" "db_rick_data"';
var pg_restore_args = ' --host 127.0.0.1 --port 5432 --username "postgres" --dbname "postgres" --section pre-data --section data --section post-data --create --clean --verbose ".\\db_rick_data.backup.tar"';

/*
var pg_dump_args = ' -i -h localhost -p 5432 -U rick -F t -b -v -f "D:\aaa.tar" db_rick_data';
var pg_restore_args = ' -i -h localhost -p 5432 -U rick -d db_rick_data -v "D:\aaa.tar"';
*/

if(process.platform === 'win32'){
  system_encoding = 'cp950';
}

export class AzChileProcess {
  constructor() {
  }

  runCp(command, logfile, cb){
    const new_env = process.env;
    new_env.PGPASSWORD = pg_password;

    let cp = child_process.exec(command, {env: new_env}/*options, [optional]*/);
    cp.stdout.setEncoding('binary');
    cp.stderr.setEncoding('binary');

    /*
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
    */

    let log_stream = fs.createWriteStream(logfile);

    cp.stdout.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stdout: ' + print_text);
      log_stream.write(data);
    });

    cp.stderr.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stderr: ' + print_text);
      log_stream.write(data);
    });

    cp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      log_stream.end(function () {
        console.log('done');
        if(cb){
          cb(code);
        }
      });
    });
  }

  dump({host = '127.0.0.1', port = 5432, format = 'plain', db = 'db_rick_data', backupFile = 'db_rick_data.backup.tar', username = 'postgres', logFile = 'dump.log'}){
    let dump_args = ` --host ${host} --port ${port} --username "${username}" --format ${format} --blobs --create --clean --section pre-data --section data --section post-data --encoding UTF8 --inserts --verbose --file "${backupFile}" "${db}"`;
    return new Promise((resolve, reject) => {
      this.runCp(path.join(__dirname, '.\\bin\\win32\\bin\\pg_dump.exe') + dump_args, logFile, arg => {
        // if(arg){
        //   reject(arg);
        // }else{
        //   resolve(arg);
        // }
        resolve(arg);
      });
    });
  }

  dumpPlain(dump_args){
    let args = {...dump_args};
    args.format = 'plain';
    return this.dump(dump_args);
  }

  dumpTar(dump_args){
    let args = {...dump_args};
    args.format = 'tar';
    return this.dump(args);
  }

  restoreTar({host = '127.0.0.1', port = 5432, loginDb = 'postgres', backupFile = 'db_rick_data.backup.tar', username = 'postgres', logFile = 'restore.log'}){
    let restore_args = ` --host ${host} --port ${port} --username "${username}" --dbname ${loginDb} --section pre-data --section data --section post-data --create --clean --verbose "${backupFile}"`;
    return new Promise((resolve, reject) => {
      this.runCp(path.join(__dirname, '.\\bin\\win32\\bin\\pg_restore.exe') + restore_args, logFile, arg => {
        // if(arg){
        //   reject(arg);
        // }else{
        //   resolve(arg);
        // }
        resolve(arg);
      });
    });
  }

  restorePlain({host = '127.0.0.1', port = 5432, loginDb = 'postgres', backupFile = 'db_rick_data.backup.tar', username = 'postgres', logFile = 'restore.log'}){
    let restore_args = ` --host ${host} --port ${port} --username "${username}" ${loginDb} < "${backupFile}"`;
    return new Promise((resolve, reject) => {
      this.runCp(path.join(__dirname, '.\\bin\\win32\\bin\\psql.exe') + restore_args, logFile, arg => {
        // if(arg){
        //   reject(arg);
        // }else{
        //   resolve(arg);
        // }
        resolve(arg);
      });
    });
  }

  test01(cb){
    const new_env = process.env;
    new_env.PGPASSWORD = pg_password;

    let cp = child_process.exec(path.join(__dirname, '.\\bin\\win32\\bin\\pg_dump.exe') + pg_dump_args, {env: new_env}/*options, [optional]*/);
    cp.stdout.setEncoding('binary');
    cp.stderr.setEncoding('binary');

    /*
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
    */

    let log_stream = fs.createWriteStream('dump.log');

    cp.stdout.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stdout: ' + print_text);
      log_stream.write(data);
    });

    cp.stderr.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stderr: ' + print_text);
      log_stream.write(data);
    });

    cp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      if(cb){
        cb();
      }
      log_stream.end(function () { console.log('done'); });
    });
  }

  test02(cb){
    const new_env = process.env;
    new_env.PGPASSWORD = pg_password;

    let cp = child_process.exec(path.join(__dirname, '.\\bin\\win32\\bin\\pg_restore.exe') + pg_restore_args, {env: new_env}/*options, [optional]*/);
    cp.stdout.setEncoding('binary');
    cp.stderr.setEncoding('binary');

    /*
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
    */

    let log_stream = fs.createWriteStream('restore.log');

    cp.stdout.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stdout: ' + print_text);
      log_stream.write(data);
    });

    cp.stderr.on('data', function (data) {
      // let print_text = iconv.decode(new Buffer(data, 'binary'), system_encoding);  //eslint-disable-line no-unused-vars
      // console.log('stderr: ' + print_text);
      log_stream.write(data);
    });

    cp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      if(cb){
        cb();
      }
      log_stream.end(function () { console.log('done'); });
    });
  }
}

let _AzChileProcess = new AzChileProcess(); //eslint-disable-line no-underscore-dangle

export default _AzChileProcess;
