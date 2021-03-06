// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

var subject = require('../lib/record');
var createServer = require('./helpers/server');
var createTmpdir = require('./helpers/tmpdir');
var assert = require('assert');
var http = require('http');
var fs = require('fs');

var fixtures = require('./fixtures');

describe('record', function () {
  var server, tmpdir, req;

  beforeEach(function (done) {
    server = createServer(done);
  });

  afterEach(function (done) {
    server.teardown(done);
  });

  beforeEach(function (done) {
    tmpdir = createTmpdir(done);
  });

  afterEach(function (done) {
    tmpdir.teardown(done);
  });

  beforeEach(function () {
    req = http.request({
      host: server.addr,
      port: server.port,
      path: '/test/*/test'
    });
    req.setHeader('User-Agent', 'My User Agent/1.0');
    req.setHeader('x-escape-comments', '*//*');
    req.setHeader('Connection', 'close');
  });

  it('returns the rendered ejs data', function (done) {
    req.on('response', function (res) {
      subject(req, res, tmpdir.join('foo.js')).then(function (data) {
        assert.equal(typeof data, 'string')
        assert.ok(/module.exports = /.test(data))
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    req.end();
  });

  it('records the response to disk', function (done) {
    const expected = fixtures.base64.replace('{addr}', server.addr).replace('{port}', server.port);

    req.on('response', function (res) {
      const filename = tmpdir.join('foo.js')

      subject(req, res, filename, {humanReadable: false}).then(() => {
        assert.equal(fs.readFileSync(filename, 'utf8'), expected);
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    req.end();
  });


  it('records the response to disk in human readable format', function (done) {
    const expected = fixtures.humanReadable.replace('{addr}', server.addr).replace('{port}', server.port);

    req.on('response', function (res) {
      const filename = tmpdir.join('human.js')

      subject(req, res, filename).then(() => {
        assert.equal(fs.readFileSync(filename, 'utf8'), expected);
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    req.end();
  });
});
