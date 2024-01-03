import json
import boto3

class Module:

    def __init__(self, id, version, title, summary, description, difficulty, tags, enrollment, finished, problems, solved):
        self.id = id
        self.version = version
        self.title = title
        self.summary = summary
        self.description = description
        self.difficulty = difficulty
        self.tags = tags
        self.enrollment = enrollment
        self.finished = finished
        self.problems = problems
        self.solved = solved

client = boto3.client('s3')

def lambda_handler(event, context):
    
    print('event', json.dumps(event))
    
    httpMethod = event['httpMethod']
    httpPath = event['path']
    
    user = event['requestContext']['authorizer']['claims']['email']
    
    if httpMethod == 'GET' and httpPath == '/home/enrolled-modules':
        
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
        
        #result['finished'] = finished['modules'].get(moduleId, None)
        
        solvedProblems = {}
    
        try:
            response = client.get_object(
                Bucket='vdu-coding-tutor-users',
                Key=user + '/solved.json',
            )

            solvedProblems = json.loads(response['Body'].read().decode('utf-8'))
        except Exception as e:
            pass
        
        moduleIds = ', '.join(["'{}'".format(k) for k in enrolled['modules'].keys()])
        
        modulesQuery = f"SELECT s.id, s.version, s.name, s.summary, s.description, s.difficulty, s.tags, s.problems FROM S3Object[*].modules[*] s WHERE s.id IN ({moduleIds})"
        
        resp = client.select_object_content(
            Bucket = 'vdu-coding-tutor-modules',
            Key = 'modules.json',
            Expression = modulesQuery,
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
        
        result = {}

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
                            module.get('tags', []), 
                            enrolled['modules'].get(module['id'], None), 
                            finished['modules'].get(module['id'], None),
                            module['problems'],  
                            [problemId for problemId in module['problems'] if solvedProblems.get(problemId, False)]
                        )
                    )

        result['modules'] = [module.__dict__ for module in modules]
        
        # TODO implement
        return {
            'statusCode': 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps(result)
        }
        
    elif httpMethod == 'GET' and httpPath == '/home/achievements':
        
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
        
        moduleIds = ', '.join(["'{}'".format(k) for k in finished['modules'].keys()])
        
        modulesQuery = f"SELECT s.achievement FROM S3Object[*].modules[*] s WHERE s.id IN ({moduleIds})"
        
        resp = client.select_object_content(
            Bucket = 'vdu-coding-tutor-modules',
            Key = 'modules.json',
            Expression = modulesQuery,
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
        
        result = {}

        achievements = []
        for event in resp['Payload']:
            if 'Records' in event:
                content = event['Records']['Payload'].decode()
                for module in json.loads('[' + content[0:len(content)-1] + ']'):
                    achievement = module.get('achievement', None)
                    
                    if achievement is not None:
                        achievements.append(achievement)

        result = achievements
        
        # TODO implement
        return {
            'statusCode': 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps(result)
        }
    
    # TODO implement
    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        'body': json.dumps('Hello from Lambda!')
    }
