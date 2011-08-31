#!/usr/bin/env python
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template, util as webappUtil
from controllers import Level, LevelSet
import util

class Index(webapp.RequestHandler):
  def get(self):
    util.render(self,"index.html",{})

def main():
  application = webapp.WSGIApplication([
    ('/', Index)
    ,('/level/create',Level.Create)
    ,(r'/level/update/([^/\?#]+)',Level.Update)
    ,(r'/level/delete/([^/\?#]+)',Level.Delete)
    ,(r'/level/?([^/\?#]*)',Level.Read)
    ,('/levelSet/create',LevelSet.Create)
    ,(r'/levelSet/update/([^/\?#]+)',LevelSet.Update)
    ,(r'/levelSet/delete/([^/\?#]+)',LevelSet.Delete)
    ,(r'/levelSet/?([^/\?#]+)',LevelSet.Read)
    #,('/user/',User.)
  ],debug=True)
  webappUtil.run_wsgi_app(application)


if __name__ == '__main__':
  main()
