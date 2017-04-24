'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.md5 = md5;

var _blueimpMd = require('blueimp-md5');

var _blueimpMd2 = _interopRequireDefault(_blueimpMd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * md5
 *
 * @param   str 字符串
 * @param   key 秘钥
 */
function md5(str, key) {
  return (0, _blueimpMd2.default)(str, key);
} //common lib