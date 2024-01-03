import json
import boto3

client = boto3.client('s3')

def lambda_handler(event, context):
    
    print('event', json.dumps(event))
    
    # Retrieving quizzes list
    response = client.get_object(
        Bucket='vdu-coding-tutor-quizzes',
        Key='quizzes.json',
    )
    quizzes = json.loads(response['Body'].read().decode('utf-8'))
    
    print('quizz:original', json.dumps(quizzes))
    
    to_delete = []
    
    for evt in event['Records']:
    
        # TODO: should handle all events
        payload = json.loads(evt['body'])
        
        response = client.get_object(
            Bucket='vdu-coding-tutor-quizzes',
            Key=payload['s3']['key'],
        )
        quizz = json.loads(response['Body'].read().decode('utf-8'))
        
        print('quizz', payload['action'], json.dumps(quizz))
        
        # Always deleting an item
        for i, obj in enumerate(quizzes['quizzes']):
            if obj['id'] == quizz['id']:
                del quizzes['quizzes'][i]
                break
        
        # Adding to the end of the list if create/modify
        if payload['action'] == 'PUT':
            quizzes['quizzes'].append(quizz)
        elif payload['action'] == 'DELETE':
            to_delete.append(quizz['id'])

    print('quizz:modified', json.dumps(quizzes))
    
    # Putting the modified quizzes list
    response = client.put_object(
        Bucket='vdu-coding-tutor-quizzes',
        Body=json.dumps(quizzes),
        Key='quizzes.json'
    )
    
    if len(to_delete) > 0:
        
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/delete_objects.html
        client.delete_objects(
            Bucket='vdu-coding-tutor-quizzes',
            Delete={
                'Objects': [{'Key': ('quizzes/' + id + '.json') } for id in to_delete],
                'Quiet': True
            },
        )
        
        print('quizzes:deleted', [{'Key': ('quizzes/' + id + '.json') } for id in to_delete])
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
