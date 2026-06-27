// Builds a namespaced Redis key per-identifier per-route
function buildKey(namespace, identifier, route) {
  return `rl:${namespace}:${route}:${identifier}`;
}

module.exports = { buildKey };