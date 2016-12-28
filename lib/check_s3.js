"use strict";

const AWS = require('aws-sdk');
const util = require('util');

const promisify = function(aws) {
  aws.Request.prototype.promise = function() {
    return new Promise(function(accept, reject) {
      this.on('complete', function(response) {
        if (response.error) {
          reject(response.error);
        } else {
          accept(response.data);
        }
      });
      this.send();
    }.bind(this));
  };
  aws.Request.prototype.promiseRaw = function() {
    return new Promise(function(accept, reject) {
      this.on('complete', function(response) {
        if (response.error) {
          reject(response.error);
        } else {
          accept(response);
        }
      });
      this.send();
    }.bind(this));
  };
};

promisify(AWS);

const parse_path_s3 = function(path) {
  let result = {};
  let bits = path.split(':');
  if (! path.match(/s3:.*:.*:[^\/].*/)) {
    throw new Error("Invalid output path do you mean s3:::bucket/path ?");
  }
  result.Bucket = bits[3].split('/')[0];
  result.Region = bits[1] || 'us-east-1';
  result.Key = '' + bits[3].split('/').splice(1).join('/');
  return result;
};

const check_exists_s3 = function(output_path) {
  let params = parse_path_s3(output_path);
  const s3 = new AWS.S3({region:params.Region});
  delete params.Region;
  params.Key = (params.Key.length > 0 ? params.Key.replace(/\/$/,'') + '/' : '');
  return s3.headObject(params).promiseRaw().then(function(resp) {
    return resp.httpResponse.headers['x-amz-meta-version'];
  }).catch(function(err) {
    if (err.statusCode == 404 || err.statusCode == 403) {
      return false;
    }
    throw err;
  });
};

module.exports = check_exists_s3;