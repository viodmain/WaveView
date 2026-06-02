// This file ensures prop-types is bundled into the production build
// Some libraries (plotly.js -> glamorous) use require("prop-types") at runtime
// Without this import, prop-types is tree-shaken out of the bundle
import PropTypes from 'prop-types';

// Make PropTypes available globally for libraries that use require("prop-types")
if (typeof window !== 'undefined') {
  (window as any).PropTypes = PropTypes;
}

export default PropTypes;
