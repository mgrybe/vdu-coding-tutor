import json
import resource
import subprocess
import base64
import traceback
import io
import os
import random
import yaml
import boto3
#import jwt
from contextlib import redirect_stdout
from pyflakes.api import check

print("Loading function")

client = boto3.client('s3')

class Issue:

    def __init__(self, type, level, message, starLine = None, startColumn = None, endLine = None, endColumn = None):
        self.type = type
        self.level = level
        self.message = message
        self.starLine = starLine
        self.startColumn = startColumn
        self.endLine = endLine
        self.endColumn = endColumn

    #def toJson(self):
    #    return json.dumps(self, default=lambda o: o.__dict__)

class Reporter:

    def __init__(self):
        self._issues = []

    def unexpectedError(self, filename, msg):
        self.addAlert('ERROR', msg)

    # Custom method
    def addAlert(self,  level, msg):
        self._issues.append(Issue('ALERT', level, str(msg), None, None))

    def syntaxError(self, filename, msg, lineno, offset, text):
        self._issues.append(Issue('CODE', 'ERROR', msg, lineno, offset))

    def flake(self, msg):
        flakeParts = str(msg).split(':')

        self._issues.append(Issue('CODE', 'WARN', ":".join(flakeParts[3:]).strip(), int(flakeParts[1]), int(flakeParts[2])))

    def hasIssues(self):
        return len(self._issues) > 0

    def hasErrors(self):
        return len([issue for issue in self._issues if issue.level == 'ERROR']) > 0

def isBlank (myString):
    return not (myString and myString.strip())

def lambda_handler(event, context):

    try:

        print('event: ' + json.dumps(event))

        httpMethod = event['httpMethod']

        if httpMethod == 'OPTIONS':
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                }
            }

        user = event['requestContext']['authorizer']['claims']['email']

        if httpMethod == 'GET':
            challenge = random.choice(os.listdir("./challenges"))

            parsedChallenge = None
            with open("./challenges/" + challenge, "r") as stream:
                parsedChallenge = yaml.safe_load(stream)

            del parsedChallenge['assertions']
            parsedChallenge['id'] = challenge.replace('.yaml', '')

            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                "body": json.dumps(parsedChallenge)
            }

        payload = json.loads(event['body'])

        code = base64.b64decode(payload['code']).decode('utf-8')

        result = {'result': {}}

        # START: Code checks
        reporter = Reporter()

        #try:
        #    compile(code, 'code', 'exec')
        #except SyntaxError as e:
        #    reporter.syntaxError('code', e.args[0], e.lineno, e.offset, e.text)
        #except ValueError as e:
        #    reporter.addAlert('code', 'ERROR', str(e))
        #except NameError as e:
        #    reporter.addAlert('code', 'ERROR', str(e))

        if not reporter.hasErrors():
            check(code, 'code', reporter)

        # END: Code checks

        if not reporter.hasIssues() and not isBlank(code):
            challengeId = event['queryStringParameters']['challengeId']
            should_submit = event['queryStringParameters']['submit'] == 'true'

            resp = client.select_object_content(
                Bucket = 'vdu-coding-tutor-problems',
                Key = 'problems.json',
                Expression = """SELECT s.* FROM S3Object[*].problems[*] s WHERE s.id = '""" + challengeId + """'""",
                ExpressionType = 'SQL',
                InputSerialization={
                    'JSON': {
                        'Type': 'DOCUMENT'
                    }
                },
                OutputSerialization={
                    'JSON': {
                        'RecordDelimiter': ','
                    }
                }
            )

            parsedChallenge = None
            for event in resp['Payload']:
                if 'Records' in event:
                    content = event['Records']['Payload'].decode()
                    parsedChallenge = json.loads(content[0:len(content)-1])

            challenge = {'challengeId': challengeId, 'code': code, 'assertions': ''}

            if should_submit:
                challenge['assertions'] = parsedChallenge['assertions']

            input = base64.b64encode(json.dumps(challenge).encode('ascii'))

            with redirect_stdout(io.StringIO()) as f:
                try:
                    # https://docs.python.org/3/library/subprocess.html
                    proc = subprocess.run(["python", "code.py"], timeout=10, input=input.decode('ascii'), capture_output=True, text=True)
                    print(proc.stdout)
                    #print(proc.stderr)

                    if proc.returncode == 1:
                        reporter.unexpectedError('code', 'Seems like your code has syntax errors.')
                    elif proc.returncode == 2:
                        reporter.unexpectedError('code', 'Seems like your code has errors.')
                    elif proc.returncode == 3:
                        reporter.unexpectedError('code', 'Seems like your code consumes too much memory.')
                except subprocess.TimeoutExpired:
                    reporter.unexpectedError('code', 'Seems like your code takes too much time to execute.')
                except subprocess.CalledProcessError:
                    reporter.addAlert('ERROR', 'Crash 1')
                except BaseException as e:
                    reporter.addAlert('ERROR', 'Crash 2')
                    print(traceback.format_exc())

            stdout = f.getvalue()

            if not reporter.hasIssues():

                print('stdout: ' + stdout)

                result['result'] = json.loads(stdout)

                bucket_name = 'vdu-coding-tutor-users'

                if result['result']['solved'] and should_submit:
                    solvedProblems = {}

                    try:
                        response = client.get_object(
                            Bucket=bucket_name,
                            Key=user + '/solved.json',
                        )

                        solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
                    except Exception as e:
                        # Does not exist
                        pass

                    solvedProblems[parsedChallenge['id']] = True

                    # Updating solved problems
                    response = client.put_object(
                        Bucket=bucket_name,
                        Body=json.dumps(solvedProblems),
                        Key=user + '/solved.json'
                    )

                    # Saving last solution (overwriting the existing one)
                    response = client.put_object(
                        Bucket=bucket_name,
                        Body=json.dumps({'code': code}),
                        Key=user + '/solution.' + challengeId + '.json'
                    )

        if reporter.hasIssues():
            # TODO: refactor this
            for issue in reporter._issues:
                if (issue.type == 'CODE' and issue.level == 'ERROR'):
                    reporter.addAlert('ERROR', 'Seems like your code has errors.')
                    break

            for issue in reporter._issues:
                if (issue.type == 'CODE' and issue.level == 'WARN'):
                    reporter.addAlert('WARN', 'Seems like your code has some issues.')
                    break

            result['result']['issues'] = [issue.__dict__ for issue in reporter._issues]

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps(result),
        }
    except Exception as e:
        print('Exception: ' + str(e))
        print(traceback.format_exc())
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps({'error': str(e)})
        }
