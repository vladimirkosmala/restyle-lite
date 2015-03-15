(function (O) {
  'use strict';

  var
    toString = O.toString,
    has = O.hasOwnProperty,
    camelFind = /([a-z])([A-Z])/g,
    ignoreSpecial = /^@(?:page|font-face)/,
    isMedia = /^@(?:media)/,
    isArray = Array.isArray || function (arr) {
      return toString.call(arr) === '[object Array]';
    },
    empty = [],
    restyle;

  function ReStyle(component, node, css, prefixes, doc) {
    this.component = component;
    this.node = node;
    this.css = css;
    this.prefixes = prefixes;
    this.doc = doc;
  }

  ReStyle.prototype = {
    replace: function (substitute) {
      if (!(substitute instanceof ReStyle)) {
        substitute = restyle(
          this.component, substitute, this.prefixes, this.doc
        );
      }
      this.remove();
      ReStyle.call(
        this,
        substitute.component,
        substitute.node,
        substitute.css,
        substitute.prefixes,
        substitute.doc
      );
    },
    remove: function () {
      var node = this.node,
        parentNode = node.parentNode;
      if (parentNode) {
        parentNode.removeChild(node);
      }
    },
    valueOf: function () {
      return this.css;
    }
  };

  function camelReplace(m, $1, $2) {
    return $1 + '-' + $2.toLowerCase();
  }

  function create(key, value, prefixes) {
    var
      css = [],
      pixels = typeof value === 'number' ? 'px' : '',
      k = key.replace(camelFind, camelReplace),
      i;
    for (i = 0; i < prefixes.length; i++) {
      css.push('-', prefixes[i], '-', k, ':', value, pixels, ';');
    }
    css.push(k, ':', value, pixels, ';');
    return css.join('');
  }

  function property(previous, key) {
    return previous.length ? previous + '-' + key : key;
  }

  function generate(css, previous, obj, prefixes) {
    var key, value, i;
    for (key in obj) {
      if (has.call(obj, key)) {
        if (typeof obj[key] === 'object') {
          if (isArray(obj[key])) {
            value = obj[key];
            for (i = 0; i < value.length; i++) {
              css.push(
                create(property(previous, key), value[i], prefixes)
              );
            }
          } else {
            generate(
              css,
              property(previous, key),
              obj[key],
              prefixes
            );
          }
        } else {
          css.push(
            create(property(previous, key), obj[key], prefixes)
          );
        }
      }
    }
    return css.join('');
  }

  function parse(component, obj, prefixes) {
    var
      css = [],
      at, cmp, special, k, v,
      same, key, value, i, j;
    for (key in obj) {
      if (has.call(obj, key)) {
        at = key.charAt(0) === '@';
        same = at || !component.indexOf(key + ' ');
        cmp = at && isMedia.test(key) ? component : '';
        special = at && !ignoreSpecial.test(key);
        k = special ? key.slice(1) : key;
        value = empty.concat(obj[key]);
        for (i = 0; i < value.length; i++) {
          v = value[i];
          if (special) {
            j = prefixes.length;
            while (j--) {
              css.push('@-', prefixes[j], '-', k, '{',
                parse(cmp, v, [prefixes[j]]),
                '}');
            }
            css.push(key, '{', parse(cmp, v, prefixes), '}');
          } else {
            css.push(
              same ? key : component + key,
              '{', generate([], '', v, prefixes), '}'
            );
          }
        }
      }
    }
    return css.join('');
  }

  // hack to avoid JSLint shenanigans
  if ({undefined: true}[typeof document]) {
    // in node, by default, no prefixes are used
    restyle = function (component, obj, prefixes) {
      if (typeof component === 'object') {
        prefixes = obj;
        obj = component;
        component = '';
      } else {
        component += ' ';
      }
      return parse(component, obj, prefixes || empty);
    };
    // useful for different style of require
    restyle.restyle = restyle;
  } else {
    restyle = function (component, obj, prefixes, doc) {
      if (typeof component === 'object') {
        doc = prefixes;
        prefixes = obj;
        obj = component;
        c = (component = '');
      } else {
        c = component + ' ';
      }
      var c, d = doc || (doc = document),
        css = parse(c, obj, prefixes || (prefixes = restyle.prefixes)),
        head = d.head ||
          d.getElementsByTagName('head')[0] ||
          d.documentElement,
        node = head.insertBefore(
          d.createElement('style'),
          head.lastChild
        );
      node.type = 'text/css';
      // it should have been
      // if ('styleSheet' in node) {}
      // but JSLint bothers in that way
      if (node.styleSheet) {
        node.styleSheet.cssText = css;
      } else {
        node.appendChild(d.createTextNode(css));
      }
      return new ReStyle(component, node, css, prefixes, doc);
    };
  }

  // bringing animation utility in window-aware world only
  if (!{undefined: true}[typeof window]) {
    restyle.animate = (function (g) {

      var
        animationType,
        transitionType
      ;

      switch (true) {
        case !!g.AnimationEvent:
          animationType = 'animationend';
          break;
        case !!g.WebKitAnimationEvent:
          animationType = 'webkitAnimationEnd';
          break;
        case !!g.MSAnimationEvent:
          animationType = 'MSAnimationEnd';
          break;
        case !!g.OAnimationEvent:
          animationType = 'oanimationend';
          break;
      }

      switch (true) {
        case !!g.TransitionEvent:
          transitionType = 'transitionend';
          break;
        case !!g.WebKitTransitionEvent:
          transitionType = 'webkitTransitionEnd';
          break;
        case !!g.MSTransitionEvent:
          transitionType = 'MSTransitionEnd';
          break;
        case !!g.OTransitionEvent:
          transitionType = 'oTransitionEnd';
          break;
      }

      ReStyle.prototype.getAnimationDuration = function (el, name) {
        for (var
          chunk, duration,
          classes = el.className.split(/\s+/),
          i = classes.length; i--;
        ) {
          chunk = classes[i];
          if (
            chunk.length &&
            (new RegExp('\\.' + chunk + '(?:|\\{|\\,)([^}]+?)\\}')).test(this.css)
          ) {
            chunk = RegExp.$1;
            if (
              (new RegExp(
                'animation-name:' +
                name +
                ';.*?animation-duration:([^;]+?);'
              )).test(chunk) ||
              (new RegExp(
                'animation:\\s*' + name + '\\s+([^\\s]+?);'
              )).test(chunk)
            ) {
              chunk = RegExp.$1;
              duration = parseFloat(chunk);
              if (duration) {
                return duration * (/[^m]s$/.test(chunk) ? 1000 : 1);
              }
            }
          }
        }
        return -1;
      };

      ReStyle.prototype.getTransitionDuration = function (el) {
        var
          cs = getComputedStyle(el),
          duration = cs.getPropertyValue('transition-duration') ||
                     /\s(\d+(?:ms|s))/.test(
                       cs.getPropertyValue('transition')
                     ) && RegExp.$1
        ;
        return parseFloat(duration) * (/[^m]s$/.test(duration) ? 1000 : 1);
      };

      ReStyle.prototype.transit = transitionType ?
        function (el, callback) {
          function onTransitionEnd(e) {
            drop();
            callback.call(el, e);
          }
          function drop() {
            el.removeEventListener(transitionType, onTransitionEnd, false);
          }
          el.addEventListener(transitionType, onTransitionEnd, false);
          return {drop: drop};
        } :
        function (el, callback) {
          var i = setTimeout(callback, this.getTransitionDuration(el));
          return {drop: function () {
            clearTimeout(i);
          }};
        }
      ;

      ReStyle.prototype.animate = animationType ?
        function animate(el, name, callback) {
          function onAnimationEnd(e) {
            if (e.animationName === name) {
              drop();
              callback.call(el, e);
            }
          }
          function drop() {
            el.removeEventListener(animationType, onAnimationEnd, false);
          }
          el.addEventListener(animationType, onAnimationEnd, false);
          return {drop: drop};
        } :
        function animate(el, name, callback) {
          var i, drop, duration = this.getAnimationDuration(el, name);
          if (duration < 0) {
            drop = O;
          } else {
            i = setTimeout(
              function () {
                callback.call(el, {
                  type: 'animationend',
                  animationName: name,
                  currentTarget: el,
                  target: el,
                  stopImmediatePropagation: O,
                  stopPropagation: O,
                  preventDefault: O
                });
              },
              duration
            );
            drop = function () {
              clearTimeout(i);
            };
          }
          return {drop: drop};
        }
      ;
    }(window));
  }

  restyle.customElement = function (name, constructor, proto) {
    var
      key,
      ext = 'extends',
      prototype = Object.create(constructor.prototype),
      descriptor = {prototype: prototype},
      has = descriptor.hasOwnProperty,
      isExtending = proto && has.call(proto, ext)
    ;
    if (isExtending) {
      descriptor[ext] = proto[ext];
    }
    for (key in proto) {
      if (key !== ext) {
        prototype[key] = (
          key === 'css' ?
            restyle(
              isExtending ?
               (proto[ext] + '[is=' + name + ']') :
               name,
              proto[key]
            ) :
            proto[key]
        );
      }
    }
    return document.registerElement(name, descriptor);
  };

  restyle.prefixes = [
    'webkit',
    'moz',
    'ms',
    'o'
  ];

  return restyle;

/**
 * not sure if TODO since this might be prependend regardless the parser
 *  @namespace url(http://www.w3.org/1999/xhtml);
 *  @charset "UTF-8";
 */

}({}))