// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var messageHash = require('incoming-message-hash');
var assert = require('assert');
var mkdirp = require('mkdirp');
var path = require('path');
var buffer = require('./lib/buffer');
var proxy = require('./lib/proxy');
var record = require('./lib/record');
var load = require('./lib/load');
var curl = require('./lib/curl');
var debug = require('debug')('yakbak:server');

/**
 * Returns a new yakbak proxy middleware.
 * @param {String} host The hostname to proxy to
 * @param {Object} opts
 * @param {String} opts.dirname The tapes directory
 * @param {Boolean} opts.noRecord if true, requests will return a 404 error if the tape doesn't exist
 * @param {Boolean} opts.delay add a delay after recording a tape
 * @param {Boolean} [opts.humanReadable=true] record tapes in human readable form if possible
 * @returns {Function}
 */

module.exports = function (host, opts) {
  assert(opts.dirname, 'You must provide opts.dirname');

  return function (req, res) {
    mkdirp.sync(opts.dirname);

    debug('req', req.url);

    return buffer(req).then(function (body) {
      var file = path.join(opts.dirname, tapename(req, body));

      return load(file)
        .catch(() => {
          if (opts.noRecord) {
            throw new RecordingDisabledError('Recording Disabled');
          } else {
            return proxy(req, body, host)
              .then((pres) => record(pres.req, pres, file, opts))
              .then((data) => load(file, data))
          }
        })
    }).then(function (tape) {
      return tape(req, res);
    }).catch(function (err) {
      /* eslint-disable no-console */
      console.log('An HTTP request has been made that yakbak does not know how to handle "%s"', err);
      console.log(curl.request(req));
      /* eslint-enable no-console */
      res.statusCode = err.status;
      res.end(err.message);
    });

  };

  /**
   * Returns the tape name for `req`.
   * @param {http.IncomingMessage} req
   * @param {Array.<Buffer>} body
   * @returns {String}
   */

  function tapename(req, body) {
    var hash = opts.hash || messageHash.sync;

    return hash(req, Buffer.concat(body)) + '.js';
  }

};

/**
 * Error class that is thrown when an unmatched request
 * is encountered in noRecord mode
 * @constructor
 */

function RecordingDisabledError(message) {
  this.message = message;
  this.status = 404;
}

RecordingDisabledError.prototype = Object.create(Error.prototype);
