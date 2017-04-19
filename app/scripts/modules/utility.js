/* eslint-env browser */
'use strict';

/**
 * Commonly used utility functions.
 */
const Utility = {};

/**
 * Returns the value of a given key in a URL query string. If no URL query
 * string is provided, the current URL location is used.
 * @param {string} name - Key name.
 * @param {?string} queryString - Optional query string to check.
 * @return {?string} Query parameter value.
 */
Utility.getUrlParameter = (name, queryString) => {
  const query = queryString || window.location.search;
  const param = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + param + '=([^&#]*)');
  const results = regex.exec(query);
  return results === null ? '' :
      decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * Takes a a string and returns whether or not the string is a valid email
 * by using native browser validation if available. Otherwise, does a simple
 * Regex test.
 * @param {string} email - email to validate.
 * @return {boolean} - whether email is valid
 */
Utility.isValidEmail = function(email) {
  const input = document.createElement('input');
  input.type = 'email';
  input.value = email;

  return typeof input.checkValidity === 'function' ?
      input.checkValidity() : /\S+@\S+\.\S+/.test(email);
};

export default Utility;
