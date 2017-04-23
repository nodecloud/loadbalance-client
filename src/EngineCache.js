let cache = {};

export function set(key, val) {
    cache[key] = val;
}

export function get(key) {
    return cache[key];
}