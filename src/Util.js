//common lib
import md5encode from 'blueimp-md5';

/**
 * md5
 *
 * @param   str 字符串
 * @param   key 秘钥
 */
export function md5(str, key) {
    return md5encode(str, key);
}