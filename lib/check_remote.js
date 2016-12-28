"use strict";

const ftp = require('./ftp');
const request = require('request');

const get_version_http_header = function(url,header) {
  return new Promise(function(resolve,reject) {
    request(url,function(err,response,body) {
      if (error) {
        return reject(error);
      }
      resolve(response.headers[header.toLowerCase()]);
    });
  });
};

const get_version_http_body = function(url,regex) {
  return new Promise(function(resolve,reject) {
    request(url,function(err,response,body) {
      if (error) {
        return reject(error);
      }
      var match = body.toString().match(new RegExp(regex));
      if (match && match.length > 1) {
        resolve(match[1]);
      } else {
        resolve();
      }
    });
  });
};

const get_version_ftp = function(url,regex) {
  return ftp.get_stream(url).then(function(stream) {
    return new Promise(function(resolve,reject) {
      stream.on('error',function(err) {
        reject(err);
      });
      stream.on('data',function(dat) {
        var match = dat.toString().match(new RegExp(regex));
        if (match && match.length > 1) {
          stream.destroy();
          resolve(match[1]);
        }
      });
      stream.on('end',function() {
        reject();
      });
    });
  });
};