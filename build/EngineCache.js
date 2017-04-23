"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.set = set;
exports.get = get;
let cache = {};

function set(key, val) {
    cache[key] = val;
}

function get(key) {
    return cache[key];
}