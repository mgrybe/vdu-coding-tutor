import boto3
import json

client = boto3.client('s3')

resp = client.select_object_content(
    Bucket = 'vdu-coding-tutor-problems',
    Key = 'problems.json',
    Expression = """SELECT s.id, s.name, s.difficulty FROM S3Object[*].problems[*] s""",
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

for event in resp['Payload']:
    if 'Records' in event:
        content = event['Records']['Payload'].decode()

        #print(content[0:len(content)-1])
        for problem in json.loads('[' + content[0:len(content)-1] + ']'):
            print(problem)
 
#file1.close()

#print(resp)