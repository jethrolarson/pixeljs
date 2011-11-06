from google.appengine.ext import webapp,db
import models, util

class Read(webapp.RequestHandler):
  @util.login_required
  def get(self):
    levelSets = models.getUserLevelSets()
    util.render(self,'user/read.html',{'levelSets': levelSets,'user': models.getCurrentUser()})
    
    
