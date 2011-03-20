unless Function.bind?
  Function::bind = (fn, context) ->
    context ||= this
    return -> fn.apply(context, arguments)

$(window).mousedown (e)->
  target = $ e.target
  if e.which is 1
    target.trigger 'leftdown'
  else if e.which is 2
    target.trigger 'middledown'
  else if e.which is 3
    target.trigger 'rightdown'
  true
$.fn.rightdown = (handler,disableContext)->
  @disableContext if disableContext
  @bind 'rightdown', handler
$.fn.disableContext = -> @each -> @oncontextmenu = -> false