from google.appengine.ext import webapp,db
from google.appengine.ext.webapp import template
import models, util, logging, sys
from datetime import datetime

class Index(webapp.RequestHandler):
  def get(self,levelSet):
    #TODO get list of levels from matching levelSet
    util.render(self,'levelSet/index.html',{})

class Read(webapp.RequestHandler):
  def get(self,key):
    levelSet = models.getLevelSetBykey(key)
    util.render(self,'levelSet/read.html',{'levelSet':levelSet})

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
  @util.login_required
  def get(self,key):
    levelSet = db.get(db.Key(key))
    if levelSet:
      if levelSet.owner.key() == models.getCurrentUser().key():
        levelSet.delete()
        logging.info("levelSet deleted")
        self.redirect("/user/")
      else:
        util.error(self,404,"Level doesn't belong to you")
    else:
      util.error(self,404,'Level not found')

class Random(webapp.RequestHandler):
  def get(self):
    pass