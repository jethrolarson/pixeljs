from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from django.utils import simplejson

def render(rh,viewPath,data):
  #FIXME if data['title']:
  #  data['title'] = 'Pixel-js'
  rh.response.out.write(template.render("views/"+viewPath,data))
  
def renderJSON(rh,data):
  rh.response.headers['Content-Type'] = 'application/json'
  rh.response.out.write(simplejson.dumps(data, indent=2))
  
def renderJSONP(rh,data):
  rh.response.headers['Content-Type'] = 'application/javascript'
  # TODO clean the callback
  rh.response.out.write(rh.request.get("callback")+"("+simplejson.dumps(data, indent=2)+")")

def dictToJson(d):
  return simplejson.dumps(d, indent=2)

def login_required(func):
  #TODO figure out how to recover from failed post requests
  def wrapper(self, *args, **kw):
    user = users.get_current_user()
    if not user:
      self.redirect(users.create_login_url(self.request.uri))
    else:
      func(self, *args, **kw)
  return wrapper

def isAjax(rh):
  try:
    return rh.request.headers["X-Requested-With"] == "XMLHttpRequest"
  except:
    return False

def error(rh,code,message):
  rh.error(code)
  if isAjax(rh):
    rh.response.out.write(str(code)+": " + message)
  else:
    rh.response.out.write(template.render("views/error.html", {"message":message, "code":code}))
    
class Error404(webapp.RequestHandler):
  def get(self):
    util.error(self,404,"Page not found")