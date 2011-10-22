from google.appengine.ext import webapp,db
import models, util

class Create(webapp.RequestHandler):
  @util.login_required  
  def post(self):
    user = models.User()
    #TODO yagni?
class Read(webapp.RequestHandler):
  @util.login_required
  def get(self):
    levelSets = models.getUserLevelSets()
    #get level sets
    util.render(self,'user/read.html',{'levelSets': levelSets})
    
    
