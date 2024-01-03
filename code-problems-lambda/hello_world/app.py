import json
import boto3
import uuid
from datetime import datetime

class Problem:

    def __init__(self, id, version, title, difficulty, solved, tags):
        self.id = id
        self.version = version;
        self.title = title
        self.difficulty = difficulty
        self.solved = solved
        self.tags = tags

client = boto3.client('s3')
sqsClient = boto3.client('sqs')

# https://arctype.com/blog/s3-select/

def lambda_handler(event, context):

    print(event)

    httpMethod = event['httpMethod']
    #httpPath = event['requestContext']['path']
    httpPath = event['path']

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
    
    result = {}

    if httpPath == '/problems':
        
        if httpMethod == 'GET':
    
            challengeId = None
    
            if event['queryStringParameters']:
                challengeId = event['queryStringParameters']['challengeId']
    
            if challengeId:
                
                query = """SELECT s.id, s.version, s.name, s.description, s.difficulty, s.signature, s.tags FROM S3Object[*].problems[*] s WHERE s.id = '""" + challengeId + """'"""
                
                if event['queryStringParameters'].get('detailLevel', None) == 'FULL':
                    query = """SELECT s.id, s.version, s.name, s.description, s.difficulty, s.signature, s.tags, s.assertions, s.solutions FROM S3Object[*].problems[*] s WHERE s.id = '""" + challengeId + """'"""
                    
                resp = client.select_object_content(
                    Bucket = 'vdu-coding-tutor-problems',
                    Key = 'problems.json',
                    Expression = query,
                    #Expression = """SELECT s.* FROM S3Object[*].problems[*] s WHERE s.id = '""" + challengeId + """'""",
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
                
                found = False
    
                for event in resp['Payload']:
                    if 'Records' in event:
                        content = event['Records']['Payload'].decode()
                        for problem in json.loads('[' + content[0:len(content)-1] + ']'):
                            result = problem
                            found = True
                            
                if not found:
                    return {
                        "statusCode": 404,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "*"
                        },
                        "body": json.dumps({})
                    }
    
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/solution.' + challengeId + '.json',
                    )
    
                    solution = json.loads(response['Body'].read().decode('utf-8'))
    
                    result['last_solution'] = solution
                except Exception as e:
                    pass
                
                solvedProblems = {}
    
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/solved.json',
                    )
    
                    solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    pass
                
                result['solved'] = solvedProblems.get(problem['id'], False)
            else:
                resp = client.select_object_content(
                    Bucket = 'vdu-coding-tutor-problems',
                    Key = 'problems.json',
                    Expression = """SELECT s.id, s.version, s.name, s.difficulty, s.tags FROM S3Object[*].problems[*] s""",
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
    
                solvedProblems = {}
    
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/solved.json',
                    )
    
                    solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    pass
    
                print('solvedProblems: ' + str(solvedProblems))
    
                problems = []
                for event in resp['Payload']:
                    if 'Records' in event:
                        content = event['Records']['Payload'].decode()
                        for problem in json.loads('[' + content[0:len(content)-1] + ']'):
                            problems.append(Problem(problem['id'], problem.get('version', '0'), problem['name'], problem['difficulty'], solvedProblems.get(problem['id'], False), problem.get('tags', []) ))
    
                result['problems'] = [problem.__dict__ for problem in problems]
        elif httpMethod == 'POST':
            
            payload = json.loads(event['body'])
            # Adding the timestamp using millisecond precision
            payload['version'] = str(int(datetime.utcnow().timestamp() * 1000))
            
            # TODO: validate the payload here
            if 'id' not in payload:
                payload['id'] = str(uuid.uuid4())
            
            # Creating a new module
            response = client.put_object(
                Bucket='vdu-coding-tutor-problems',
                Body=json.dumps(payload),
                Key='problems/' + payload['id'] + '.json'
            )
            
            result = payload
            
        elif httpMethod == 'DELETE':
            
            challengeId = event['queryStringParameters']['challengeId']
            
            sqs_response = sqsClient.send_message(
                QueueUrl='https://sqs.eu-north-1.amazonaws.com/949118407086/vdu-s3-problems-queue.fifo',
                DelaySeconds=0,
                MessageGroupId='problems-group',
                MessageDeduplicationId=challengeId,
                MessageBody=json.dumps({'action': 'DELETE', 's3': {'bucket': 'vdu-coding-tutor-problems', 'key': 'problems/' + challengeId + '.json'}})
            )
            
            result = challengeId
            
        response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps(result),
        }
    
        return response

# sam build --no-cached && cd .aws-sam/build/HelloWorldFunction && zip -r function.zip * && mv function.zip ../../../function.zip && cd ../../..