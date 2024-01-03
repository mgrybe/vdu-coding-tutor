import sys
import traceback
import resource
import builtins
import io
import json
import base64
from contextlib import redirect_stdout
from RestrictedPython import safe_builtins
from testing import TestReport

#print("executing code.py")

def isBlank (myString):
    return not (myString and myString.strip())

def createContext():
    def __import__sandboxed(name, globals=None, locals=None, fromlist=(), level=0):
        if name == 'os':
            raise Exception('Error importing module: ' + name)
        return __import__(name, globals, locals, fromlist, level)

    # TODO: check what built-ins are allowed
    safe_functions = {}

    for _safe_name in ['print', 'min', 'max', 'enumerate', 'filter', 'iter', 'list', 'map', 'range', 'reversed', 'set', 'sorted', 'sum', 'zip', 'all', 'any', 'dict']:
        safe_functions[_safe_name] = getattr(builtins, _safe_name)

    _builtins = safe_builtins | safe_functions
    _builtins.update({'__import__': __import__sandboxed})

    localContext = {'__builtins__': _builtins}

    return localContext

def memory_limit():
    #pass
    soft, hard = resource.getrlimit(resource.RLIMIT_AS)
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, hard))

memory_limit()

input = ""

for line in sys.stdin.readlines():
    input += line

# TODO: check why we need this (maybe subprocess needs to be closed after use?)
if not isBlank(input):

    decodedInput = base64.b64decode(input).decode('ascii')
    parsedInput = json.loads(decodedInput)

    code = parsedInput['code']
    assertions = parsedInput['assertions']

    if not isBlank(code):
        result = {'solved': False, 'output': '', 'asserts': {}}

        error = False
        stdout = None
        returnCode = 0

        with redirect_stdout(io.StringIO()) as f:
            try:
                # Execute code
                localContext = createContext()

                #print(parsedInput)

                exec(code, localContext, localContext)

                # Run assertions
                if not isBlank(assertions):
                    report = TestReport()
                    localContext['report'] = report
                    exec(assertions, localContext, localContext)
                    #result['result'] = result['result'] | {'asserts': report.__dict__}
                    result['asserts'] = report.__dict__
                    result['solved'] = report.hasPassed() and not report.hasFailed()
            except SyntaxError as e:
                returnCode = 1
            except MemoryError:
                returnCode = 3
            except Exception as e:
                #print(traceback.format_exc())
                error = True
                returnCode = 2

            stdout = f.getvalue()

            if (len(stdout) > 1000):
                stdout = stdout[0:500] + "\n<output truncated>\n" + stdout[len(stdout)-500:len(stdout)]
            else:
                stdout = stdout

            result['output'] = stdout
            #result['result'] = result['result'] | {'output': stdout} | {'solved': report.hasPassed() and not report.hasFailed()}

        print(json.dumps(result))

        sys.exit(returnCode)