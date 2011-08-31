from google.appengine.ext import db
from google.appengine.api import users

class User(db.Model):
  user = db.UserProperty(auto_current_user=True)
  created = db.DateTimeProperty(auto_now_add=True)

def getCurrentUser():
  #TODO cache for the request, wherefor art my closures?
  return User.all().filter("user = ", users.get_current_user()).get()

class LevelSet(db.Model):
  created = db.DateTimeProperty(auto_now_add=True)
  updated = db.DateTimeProperty(auto_now=True)
  name = db.StringProperty(default="untitled")
  owner = db.ReferenceProperty(User)

def getUserLevelSetByName(name):
  #todo filter by user 
  return LevelSet.all().filter('name=',name).filter('owner=',getCurrentUser().key()).get()

class Level(db.Model):
  created = db.DateTimeProperty(auto_now_add=True)
  updated = db.DateTimeProperty(auto_now=True)
  name = db.StringProperty(default="untitled")
  title = db.StringProperty(default="")
  fgcolor = db.StringProperty(default="#cef")
  bgcolor = db.StringProperty(default="#fff")
  x = db.IntegerProperty()
  y = db.IntegerProperty()
  owner = db.ReferenceProperty(User)
  levelSet = db.ReferenceProperty(LevelSet,collection_name="levelSet")  
  def getDict(self):
    d = {
      'name': self.name
      ,'title': self.title
      ,'bgcolor': self.bgcolor
      ,'fgcolor': self.fgcolor
      ,'x': self.x
      ,'y': self.y
      ,'owner': str(self.owner.key())
      ,'levelSet': str(self.levelSet.key())
    }
    return d