import json
import boto3
import uuid
from datetime import datetime

class Module:

    def __init__(self, id, version, title, summary, description, difficulty, achievement, tags, enrollment, finished, problems, solved):
        self.id = id
        self.version = version
        self.title = title
        self.summary = summary
        self.description = description
        self.difficulty = difficulty
        self.achievement = achievement
        self.tags = tags
        self.enrollment = enrollment
        self.finished = finished
        self.problems = problems
        self.solved = solved

client = boto3.client('s3')
sqsClient = boto3.client('sqs')

# https://arctype.com/blog/s3-select/

def lambda_handler(event, context):

    print(json.dumps(event))

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

    if httpPath == '/modules':

        result = {}

        if httpMethod == 'GET':
    
            moduleId = None
    
            if event['queryStringParameters']:
                moduleId = event['queryStringParameters']['moduleId']
                
    
            if moduleId:
                query = """SELECT s.id, s.version, s.name, s.summary, s.description, s.difficulty, s.achievement, s.tags, s.problems FROM S3Object[*].modules[*] s WHERE s.id = '""" + moduleId + """'"""
                
                if event['queryStringParameters'].get('detailLevel', None) == 'FULL':
                    query = """SELECT s.id, s.version, s.name, s.summary, s.description, s.difficulty, s.achievement, s.tags, s.problems FROM S3Object[*].modules[*] s WHERE s.id = '""" + moduleId + """'"""
                
                resp = client.select_object_content(
                    Bucket = 'vdu-coding-tutor-modules',
                    Key = 'modules.json',
                    Expression = query,
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
                        for module in json.loads('[' + content[0:len(content)-1] + ']'):
                            result = module
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
                    
                solvedProblems = {}
    
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/solved.json',
                    )
    
                    solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    pass
                
                result['solved'] = [problemId for problemId in result['problems'] if solvedProblems.get(problemId, False)]
                
                finished = {
                    'modules': {}
                }
                
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/finished.json',
                    )
                    
                    finished = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    # Does not exist
                    # TODO: ignore only if file does not exist
                    pass
                
                result['finished'] = finished['modules'].get(moduleId, None)
                
                enrolled = {
                    'modules': {}
                }
                
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/enrolled.json',
                    )
                    
                    enrolled = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    # Does not exist
                    pass
                
                result['enrolled'] = enrolled['modules'].get(moduleId, None)
            else:

                solvedProblems = {}
    
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/solved.json',
                    )
    
                    solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    pass
                
                finished = {
                    'modules': {}
                }
                
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/finished.json',
                    )
                    
                    finished = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    # Does not exist
                    # TODO: ignore only if file does not exist
                    pass
                
                result['finished'] = finished['modules'].get(moduleId, None)
                
                enrolled = {
                    'modules': {}
                }
                
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/enrolled.json',
                    )
                    
                    enrolled = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    # Does not exist
                    pass
                
                resp = client.select_object_content(
                    Bucket = 'vdu-coding-tutor-modules',
                    Key = 'modules.json',
                    Expression = """SELECT s.id, s.version, s.name, s.summary, s.description, s.difficulty, s.achievement, s.tags, s.problems FROM S3Object[*].modules[*] s""",
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
    
                modules = []
                for event in resp['Payload']:
                    if 'Records' in event:
                        content = event['Records']['Payload'].decode()
                        for module in json.loads('[' + content[0:len(content)-1] + ']'):
                            modules.append(
                                Module(
                                    module['id'], 
                                    module.get('version', '0'), 
                                    module['name'], 
                                    module['summary'], 
                                    module['description'], 
                                    module['difficulty'], 
                                    module.get('achievement', None),
                                    module.get('tags', []), 
                                    enrolled['modules'].get(module['id'], None), 
                                    finished['modules'].get(module['id'], None), 
                                    module['problems'],  
                                    [problemId for problemId in module['problems'] if solvedProblems.get(problemId, False)]
                                )
                            )
    
                result['modules'] = [module.__dict__ for module in modules]
        elif httpMethod == 'POST':
            
            payload = json.loads(event['body'])
            # Adding the timestamp using millisecond precision
            payload['version'] = str(int(datetime.utcnow().timestamp() * 1000))
            
            # TODO: validate the payload here
            if 'id' not in payload:
                payload['id'] = str(uuid.uuid4())
            
            # Creating a new module
            response = client.put_object(
                Bucket='vdu-coding-tutor-modules',
                Body=json.dumps(payload),
                Key='modules/' + payload['id'] + '.json'
            )
            
            result = payload
            
        elif httpMethod == 'DELETE':
            
            moduleId = event['queryStringParameters']['moduleId']
            
            sqs_response = sqsClient.send_message(
                QueueUrl='https://sqs.eu-north-1.amazonaws.com/949118407086/vdu-s3-modules-queue2.fifo',
                DelaySeconds=0,
                MessageGroupId='modules-group',
                MessageDeduplicationId=moduleId,
                MessageBody=json.dumps({'action': 'DELETE', 's3': {'bucket': 'vdu-coding-tutor-modules', 'key': 'modules/' + moduleId + '.json'}})
            )
            
            result = moduleId
            
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
        
    elif httpPath == '/modules/finish':
    
        result = {}
    
        if httpMethod == 'POST':
            
            moduleId = None
    
            if event['queryStringParameters']:
                moduleId = event['queryStringParameters']['moduleId']
    
            if moduleId:
            
                finished = {
                    'modules': {}
                }
                
                try:
                    response = client.get_object(
                        Bucket='vdu-coding-tutor-users',
                        Key=user + '/finished.json',
                    )
                    
                    finished = json.loads(response['Body'].read().decode('utf-8'))
                except Exception as e:
                    # Does not exist
                    # TODO: ignore only if file does not exist
                    pass
                
                finish = {
                    'date': str(int(datetime.utcnow().timestamp() * 1000))
                }
                
                finished['modules'][moduleId] = finish
                
                response = client.put_object(
                    Bucket='vdu-coding-tutor-users',
                    Body=json.dumps(finished),
                    Key=user + '/finished.json'
                )
                
                result = finished
        
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
        
    elif httpPath == '/enrollment':
        
        result = {}
        
        moduleId = None
        if event['queryStringParameters']:
            moduleId = event['queryStringParameters']['moduleId']
        
        if httpMethod == 'POST':
            
            enrolled = {
                'modules': {}
            }
            
            try:
                response = client.get_object(
                    Bucket='vdu-coding-tutor-users',
                    Key=user + '/enrolled.json',
                )
                
                enrolled = json.loads(response['Body'].read().decode('utf-8'))
            except Exception as e:
                # Does not exist
                pass
            
            enrollment = {
                'date': str(int(datetime.utcnow().timestamp() * 1000))
            }
            
            enrolled['modules'][moduleId] = enrollment
            
            response = client.put_object(
                Bucket='vdu-coding-tutor-users',
                Body=json.dumps(enrolled),
                Key=user + '/enrolled.json'
            )
            
            result = enrolled
            
        elif httpMethod == 'DELETE':
            
            enrolled = {
                'modules': {}
            }
            
            try:
                response = client.get_object(
                    Bucket='vdu-coding-tutor-users',
                    Key=user + '/enrolled.json',
                )
                
                enrolled = json.loads(response['Body'].read().decode('utf-8'))
            except Exception as e:
                # Does not exist
                pass
            
            enrolled['modules'].pop(moduleId)
            result = enrolled
            #result = enrolled['modules'].pop(moduleId)
            
            response = client.put_object(
                Bucket='vdu-coding-tutor-users',
                Body=json.dumps(enrolled),
                Key=user + '/enrolled.json'
            )
            
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