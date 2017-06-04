'use strict'
const fs = require('fs')
const glob = require('glob')
const Rxjs = require('rxjs')
const Observable = Rxjs.Observable

const lstatfn = Observable.bindNodeCallback(fs.lstat)
const rxglob = Observable.bindNodeCallback(glob)

// file type constant
const TFILE = 'file';
const TDIR = 'directory';
const TLINK = 'link';

module.exports = function (dir, options, globPattern) {
    var _pattern = dir;
    if (typeof globPattern === 'string') {
        _pattern += globPattern;
    } else if(typeof globPattern === 'undefined' || !globPattern) {
        _pattern += '/**/*';
    } else {
        throw new TypeError('globPattern must be a valid glob pattern or e falsy(default pattern will be used) but get ' + String(globPattern))
    }
    return rxglob (dir, options)
        // flat filenames list in order to process one file at a time
        .flatMap ( function (filenames) { return filenames; })
        // retrieve the file stat data
        .map ( function(filename) {
            var _stat = fs.lstatSync (filename);
            var _meta = {};
            if (_stat.isFile()) {
                _meta.type = TFILE;
            } else if(_stat.isDirectory()) {
                _meta.type = TDIR;
            } else if (_stat.isSymbolicLink()) {
                _meta.type = TLINK;
            }
            _meta.stat = _stat;
            return [
                filename,
                _meta
            ];
        })
        // reduce the stream into the metadata object
        .reduce ( function ( metadata, buffer ) {
            var _filename = buffer[0];
            var _meta = buffer[1];
            metadata[_filename] = _meta;
            return metadata;
        }, {})
        // create le response returned by the original ./crowlfs.js
        .map ( function (metadata) {
            return [
                Object.keys(metadata),
                metadata
            ]
        })
}