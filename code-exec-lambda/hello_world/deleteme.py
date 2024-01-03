import sys
import traceback
import resource
import io
import json
from contextlib import redirect_stdout

#from RestrictedPython import compile_restricted as compile
#from RestrictedPython import safe_builtins

def createContext():
    def __import__sandboxed(name, globals=None, locals=None, fromlist=(), level=0):
        #if name == 'os':
        #    raise Exception('Error importing module: ' + name)
        return __import__(name, globals, locals, fromlist, level)

    builtins = {}
    builtins.update({'__import__': __import__sandboxed})

    return {'__builtins__': builtins}

code = """
def fibonacci(n):
  if n <= 2:
    return 1
  return fibonacci(n - 1) + fibonacci(n - 2)
"""

localContext = createContext()

exec(code, localContext, localContext)

print(localContext['fibonacci'](5))