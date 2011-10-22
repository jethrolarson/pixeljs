#!/usr/bin/env python
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template, util as webappUtil
from controllers import Level, LevelSet, User
import util

webapp.template.register_template_library('util.customfilters')

class Index(webapp.RequestHandler):
  def get(self):
    util.render(self,"index.html",{})

def main():
  application = webapp.WSGIApplication([
    ('/', Index)
    ,(r'/level/delete/([^/\?#]*)',Level.Delete)
    ,(r'/level/edit()',Level.Edit)
    ,(r'/level/edit/([^/\?#]*)',Level.Edit)
    ,(r'/level/?([^/\?#]*)',Level.Read)
    ,('/levelSet/create',LevelSet.Create)
    #,(r'/levelSet/update/([^/\?#]+)',LevelSet.Update)
    ,(r'/levelSet/delete/([^/\?#]+)',LevelSet.Delete)
    ,('levelSet/random',LevelSet.Random)
    ,(r'/levelSet/?([^/\?#]+)',LevelSet.Read)
    ,(r'/user/?(?:read)?',User.Read)
    #,('/user/',User.)
  ],debug=True)
  webappUtil.run_wsgi_app(application)


if __name__ == '__main__':
  main()
