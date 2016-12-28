"use strict";

const parse_url = require('url').parse;
const ftp = require('ftp');

const util = require('util');
const Transform = require('stream').Transform;

const connect_ftp = function(url) {
  var req = parse_url(url);
  var ftp_site  = new ftp();
  var result = new Promise(function(resolve,reject) {
    ftp_site.on('ready',function() {
      resolve(ftp_site);
    });
    ftp_site.on('error',reject);
  });
  ftp_site.connect(req);
  return result.catch(function(err) {
    console.log(err);
    return null;
  });
};


const download_file = function(ftp,path) {
  return new Promise(function(resolve,reject) {
    ftp.list(path,function(err,props) {
      var size = props[0].size;
      ftp.get(path, function(err, stream) {
        if (err) throw err;
        stream.once('close', function() {
          ftp.end();
        });
        stream.size = size;
        resolve(stream);
      });
    });
  });
};

const check_modified = function(timedata,url,filename) {
  var fsstat = timedata[0];
  var ftp_site = timedata[1];

  if ( ! ftp_site ) {
    return Promise.resolve(filename);
  }

  var result = new Promise(function(resolve,reject) {
    ftp_site.lastMod(parse_url(url).path,function(err,date) {
      if (err) {
        ftp_site.end();
        reject(err);
      }
      if ((new Date(fsstat.mtime)).getTime() < date.getTime() ) {
        resolve( download_file( ftp_site, parse_url(url).path, filename ).then(function(filename) {
          fs.utimesSync(filename, date,date);
        }) );
      } else {
        ftp_site.end();
        resolve( filename );
      }
    });
  });
  return result;
};

const get_cached_file = function(url,filename) {
  return Promise.all( [ get_modtime(filename), connect_ftp(url) ] ).then(function(promise_results) {
    return check_modified(promise_results,url,filename);
  });
};

const get_stream = function(url) {
  return connect_ftp(url).then(function(ftp) {  return download_file(ftp,parse_url(url).path); });
}

exports.get_stream = get_stream;