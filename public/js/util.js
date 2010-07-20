(function(){
  var _a, _b, _c, _d, _e;
  !(typeof (_a = Function.bind) !== "undefined" && _a !== null) ? (Function.bind = function bind(fn, context) {
    context = context || this;
    return function() {
      return fn.apply(context, arguments);
    };
  }) : null;
  !(typeof (_b = Function.prototype.bind) !== "undefined" && _b !== null) ? (Function.prototype.bind = function bind(context) {
    var fn;
    fn = this;
    return function() {
      return fn.apply(context, arguments);
    };
  }) : null;
  window.typeOf = function typeOf(value) {
    var s;
    s = typeof value;
    s === 'object' ? value && typeof value.length === 'number' && !value.propertyIsEnumerable('length') && typeof value.splice === 'function' ? (s = 'array') : (s = 'null') : null;
    return s;
  };
  Object.isEmpty = function isEmpty(o) {
    var _c, _d, _e, key, v;
    if (typeOf(o) === 'object') {
      _d = o;
      for (_c = 0, _e = _d.length; _c < _e; _c++) {
        key = _d[_c];
        v = o[i];
        if (v !== undefined && typeOf(v) !== 'function') {
          return false;
        }
      }
    }
    return true;
  };
  !(typeof (_c = Object.clone) !== "undefined" && _c !== null) ? (Object.clone = function clone(o) {
    return $.extend({}, o);
  }) : null;
  !(typeof (_d = String.prototype.entityify) !== "undefined" && _d !== null) ? (String.prototype.entityify = function entityify() {
    return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }) : null;
  String.prototype.supplant = function supplant(o) {
    return this.replace((/{([^{}]*)}/g), function(a, b) {
      var r;
      r = o[b];
      if (typeof r === 'string' || typeof r === 'number') {
        return r;
      } else {
        return a;
      }
    });
  };
  !(typeof (_e = String.prototype.trim) !== "undefined" && _e !== null) ? (String.prototype.trim = function trim() {
    return this.replace(/^\s+|\s+$/g, "");
  }) : null;
})();
