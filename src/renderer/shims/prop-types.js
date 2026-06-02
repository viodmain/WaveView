// Shim for packages that use require("prop-types") in ESM bundles
const PropTypes = require("prop-types");
module.exports = PropTypes;
module.exports.default = PropTypes;
