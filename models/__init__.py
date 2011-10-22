from google.appengine.ext import db
from google.appengine.api import users
import logging
class User(db.Model):
  user = db.UserProperty(auto_current_user=True)
  created = db.DateTimeProperty(auto_now_add=True)

def getCurrentUser():
  user = User.all().filter("user = ", users.get_current_user()).get()
  if not user:
    user = User()
    user.put()
  return user

class LevelSet(db.Model):
  created = db.DateTimeProperty(auto_now_add=True)
  updated = db.DateTimeProperty(auto_now=True)
  name = db.StringProperty(default="untitled")
  owner = db.ReferenceProperty(User)

def getAllLevelSets():
  return LevelSet.all().fetch(100)

def getUserLevelSetByName(name):
  #FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
  return LevelSet.all().filter('name=',name).filter('owner=',getCurrentUser()).get()

def getLevelSetBykey(key):
  return db.get(db.Key(key))
def getUserLevelSets():
  logging.info(getCurrentUser().user)
  logging.info(LevelSet.all().get().owner.user)
  return LevelSet.all().filter('owner=',getCurrentUser()).fetch(100)
  
class Level(db.Model):
  created = db.DateTimeProperty(auto_now_add=True)
  updated = db.DateTimeProperty(auto_now=True)
  title = db.StringProperty(default="")
  game = db.TextProperty()
  fgcolor = db.StringProperty(default="#cef")
  bgcolor = db.StringProperty(default="#fff")
  x = db.IntegerProperty()
  y = db.IntegerProperty()
  owner = db.ReferenceProperty(User)
  levelSet = db.ReferenceProperty(LevelSet,collection_name="levelSet")
  par = db.IntegerProperty(default=3)
  def getDict(self):
    d = {
      'title': self.title
      ,'bgcolor': self.bgcolor
      ,'fgcolor': self.fgcolor
      ,'x': self.x
      ,'y': self.y
      ,'game':self.game
      ,'owner': str(self.owner.key())
      ,'levelSet': str(self.levelSet.key())
      ,'levelSetName': self.levelSet.name
      ,'key': str(self.key())
      ,'par':self.par
    }
    return d
def getDefaultGame():
  return {
    'title': 'untitled'
    ,'bgcolor': '#ddd'
    ,'fgcolor': 'blue'
    ,'x': 10
    ,'y': 10
    ,'game':'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    ,'levelSetName': 'My Levels'
    ,'par':3
  }