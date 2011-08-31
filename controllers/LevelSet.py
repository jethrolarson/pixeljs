from google.appengine.ext import webapp,db
from google.appengine.ext.webapp import template
import models, util, logging, sys
from datetime import datetime

class Index(webapp.RequestHandler):
  def get(self,levelSet):
    #TODO get list of levels from matching levelSet
    util.render(self,'levelSet/index.html',{})

class Read(webapp.RequestHandler):
  def get(self,lvl):
    util.render(self,'levelSet/read.html',{})

class Create(webapp.RequestHandler):
  def get(self):
    #return form
    util.render(self,'levelSet/create.html',{})
  
  #@util.login_required Login is optional
  def post(self):
    name=request.get('name')
    #uid = TODO get User ID
    
    #create levelSet
    
    util.render(self,'set/read.html',{'name':name})

class Update(webapp.RequestHandler):
  def post(self,key):
    """Adds/removes levels from levelSet"""
    pass

class Delete(webapp.RequestHandler):
  def post(self,key):
    pass