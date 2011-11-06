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
    util.render(self,'level/read.html',{'level': lvl.getDict()})

class Edit(webapp.RequestHandler):
  @util.login_required
  def get(self,key):
    if not len(key):
      lvl = models.getDefaultGame()
      levelSetName = self.request.get('levelSetName')
      if levelSetName:
        lvl['levelSetName'] = levelSetName
    else:
      lvl = db.get(db.Key(key))
      lvl.levelSetName = lvl.levelSet.name
      if not lvl:
        return util.error(self,404,'Level not found')
      lvl = lvl.getDict()
    util.render(self,'level/edit.html',{'level':lvl})
  
  @util.login_required #TODO make Login optional
  def post(self,ignored):
    #try:
    user = models.getCurrentUser()
    key = self.request.get('key')
    levelSet = None
    
    #new level
    if not len(key):
      level = models.Level()
      level.owner = user
    #editing existing level
    else:
      level = db.get(db.Key(key))
      if not level:
        return util.error(self,404,'Level not found')
      if level.owner.key() != user.key():
        return util.error(self,500,"You don't own this level. Jethro needs to implement cloning so you can edit a copy")
    
    levelSetName = self.request.get('levelSetName')
    if levelSetName:
      levelSet = models.getUserLevelSetByName(levelSetName)

    if not levelSet:
      levelSet = models.LevelSet(
        name = levelSetName
        ,owner = user
      )
      levelSet.put()
    level.levelSet = levelSet
    logging.info(levelSet.owner)
    level.game = self.request.get('game')
    level.title = self.request.get('title')
    level.x = int(self.request.get('x'))
    level.y = int(self.request.get('y'))
    level.fgcolor = self.request.get('fgcolor')
    level.bgcolor = self.request.get('bgcolor')
    level.put()
    if self.request.get('play'):
      self.redirect("/level/"+str(level.key()))
    else:
      self.redirect("/level/edit/"+str(level.key()))
    #except:
    #  logging.error(sys.exc_info())
    #  util.error(self,500,"Something went wrong on our end when creating the todo, please try again")


class Delete(webapp.RequestHandler):
  @util.login_required
  def get(self,key):
    level = db.get(db.Key(key))
    if level:
      if level.owner.key() == models.getCurrentUser().key():
        levelSet = level.levelSet.key()
        level.delete()
        logging.info('level deleted')
        self.redirect("/levelSet/"+str(levelSet))
      else:
        util.error(self,500,"Level doesn't belong to you")
    else:
      util.error(self,404,'Level not found')