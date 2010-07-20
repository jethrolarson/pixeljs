if not Function.bind?
  Function.bind: (fn,context)->
    context: context or this
    return ->
      return fn.apply(context, arguments)
      
if not Function::bind?
  Function::bind: (context)->
    fn: this
    return ->
      return fn.apply(context, arguments)

window.typeOf: (value)->
  s: typeof value
  if s is 'object'
    if value and typeof value.length is 'number' and not value.propertyIsEnumerable('length') and typeof value.splice is 'function'
      s: 'array'
    else 
      s: 'null'
  return s


Object.isEmpty: (o)->
  if typeOf(o) is 'object'
    for key in o
      v: o[i]
      if v isnt undefined && typeOf(v) isnt 'function'
        return false
  return true

if not Object.clone?
  Object.clone: (o)->
    $.extend({},o)

if not String::entityify?
  String::entityify: ->
    @replace(/&/g, "&amp;").replace(/</g,
      "&lt;").replace(/>/g, "&gt;")


String::supplant: (o)->
  @replace (/{([^{}]*)}/g), (a, b)->
    r = o[b]
    if typeof r is 'string' or typeof r is 'number'
      return r 
    else
     return a

if not String::trim?
  String::trim: ->
    @replace(/^\s+|\s+$/g, "")