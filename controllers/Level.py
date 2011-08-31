from google.appengine.ext import webapp,db
from google.appengine.api import users
from google.appengine.ext.webapp import template
import models, util, logging, sys
from datetime import datetime

class Read(webapp.RequestHandler):
  def get(self,key):
    if not len(key):
      return util.error(self,404,'No level specified')      
    lvl = db.get(db.Key(key))
    if not lvl:
      return util.error(self,404,'Level not found')
    util.render(self,'level/read.html',{'level': util.dictToJson(lvl.getDict())})

class Create(webapp.RequestHandler):
  @util.login_required
  def get(self):
    #return form
    util.render(self,'level/create.html',{})
  
  @util.login_required #TODO make Login optional
  def post(self):
    #try:
    user = models.getCurrentUser()
    levelSetName = self.request.get('levelSetName')
    #if user doesn't exist, create new one
    if not user:
      user = models.User()
      user.put()
    levelSet = models.getUserLevelSetByName(levelSetName)
    
    if(not levelSet):
      levelSet = models.LevelSet(
        name = levelSetName
        ,owner = user
      )
      levelSet.put()
    logging.info(str(user))
    level = models.Level(
      game=self.request.get('game')
      ,title=self.request.get('title')
      ,x=int(self.request.get('x'))
      ,y=int(self.request.get('y'))
      ,levelSet=levelSet
      ,owner=user
    )
    if self.request.get('fgcolor'):
      level.fgcolor=self.request.get('fgcolor')
    if self.request.get('bgcolor'):
      level.bgcolor=self.request.get('bgcolor')
    level.put()
    if util.isAjax(self):
      #TODO return json
      pass
    else:
      self.redirect("/level/"+str(level.key()))
    #except:
    #  logging.error(sys.exc_info())
    #  util.error(self,500,"Something went wrong on our end when creating the todo, please try again")

class Update(webapp.RequestHandler):
  def post(self,key):
    try:
      level = db.get(db.Key(key))
      level.game = self.request.get('game')
      level.title=self.request.get('title')
      level.x=self.request.get('x')
      level.y=self.request.get('y')
      #level.levelSet=levelSet
      #level.owner=levelSet.owner
      level.fgcolor=self.request.get('fgcolor')
      level.bgcolor=self.request.get('bgcolor')
      level.put()
      
      if util.isAjax(self):
        if task.deleted:
          self.response.out.write("deleted")
        else: 
          self.response.out.write(template.render("views/task.html", {"task":task}))
      else:
        self.redirect("/list/"+str(task.taskList.key())) 
    except:
      logging.error(sys.exc_info())
      util.error(self,500,"Something went wrong on our end when updating the todo, please try again")

class Delete(webapp.RequestHandler):
  def post(self,lvl):
    #verify user is owner
    
    #delete Level
    pass