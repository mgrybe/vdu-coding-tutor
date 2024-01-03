import json
import boto3

client = boto3.client('s3') 

def lambda_handler(event, context):
    
    print('event', json.dumps(event))
    
    contents = {'contents': []}
    
    # Retrieving contents list
    try:
        response = client.get_object(
            Bucket='vdu-coding-tutor-content',
            Key='contents.json',
        )
        contents = json.loads(response['Body'].read().decode('utf-8'))
    
        print('contents:original', json.dumps(contents))
    except Exception as e:
        # Does not exist
        # TODO: ignore only if file does not exist
        pass
    
    to_delete = []
    
    for evt in event['Records']:
    
        # TODO: should handle all events
        payload = json.loads(evt['body'])
        
        response = client.get_object(
            Bucket='vdu-coding-tutor-content',
            Key=payload['s3']['key'],
        )
        
        real_content = json.loads(response['Body'].read().decode('utf-8'))
        print('real:content', real_content['version'])
        content = {
            'id': real_content['id'], 
            'version': real_content['version'], 
            'title': real_content['title'],
            'tags': real_content['tags']
        }
        
        print('content', payload['action'], json.dumps(content))
        
        # Always deleting an item
        for i, obj in enumerate(contents['contents']):
            if obj['id'] == content['id']:
                del contents['contents'][i]
                break
        
        # Adding to the end of the list if create/modify
        if payload['action'] == 'PUT':
            contents['contents'].append(content)
        elif payload['action'] == 'DELETE':
            to_delete.append(content['id'])

    print('content:modified', json.dumps(contents))
    
    # Putting the modified contents list
    response = client.put_object(
        Bucket='vdu-coding-tutor-content',
        Body=json.dumps(contents),
        Key='contents.json'
    )
    
    if len(to_delete) > 0:
        
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/delete_objects.html
        client.delete_objects(
            Bucket='vdu-coding-tutor-content',
            Delete={
                'Objects': [{'Key': ('contents/' + id + '.json') } for id in to_delete],
                'Quiet': True
            },
        )
        
        print('contents:deleted', [{'Key': ('contents/' + id + '.json') } for id in to_delete])
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
