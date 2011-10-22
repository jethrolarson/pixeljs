from google.appengine.ext import webapp
from django.utils import simplejson

register = webapp.template.create_template_register()

def jsonify(object):
    return simplejson.dumps(object)

register.filter('jsonify', jsonify)