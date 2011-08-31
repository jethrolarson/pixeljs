import models

class Create(webapp.RequestHandler):
  @login_required  
  def post(self):
    user = models.User()