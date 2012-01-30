from google.appengine.ext import webapp, db
import models, util


class Read(webapp.RequestHandler):
    @util.login_required
    def get(self):
        #get key
        ls = models.getUserLevelSet()
        self.redirect("/levelSet/" + str(ls.key()))
        return
        #old stuff
        levelSets = models.getUserLevelSets()
        util.render(self, 'user/read.html', {'levelSets': levelSets, 'user': models.getCurrentUser()})
