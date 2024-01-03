import logging
import json
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqsClient = boto3.client('sqs')

def handle_connect():
    print('Handling connect')
    return 200

def handle_disconnect():
    print('Handling disconnect')
    return 200

def lambda_handler(event, context):

    route_key = event.get('requestContext', {}).get('routeKey')

    response = {'statusCode': 200}
    if route_key == '$connect':
        response['statusCode'] = handle_connect()
    elif route_key == '$disconnect':
        response['statusCode'] = handle_disconnect()
    elif route_key == 'sendmessage':
        payload = event.get('body')
        #payload = json.loads(payload)

        connection_id = event.get('requestContext', {}).get('connectionId')
        domain = event.get('requestContext', {}).get('domainName')
        stage = event.get('requestContext', {}).get('stage')

        # Send message to SQS queue
        sqs_response = sqsClient.send_message(
            QueueUrl='https://sqs.eu-north-1.amazonaws.com/949118407086/vdu-coding-assistant-chat-incoming',
            DelaySeconds=0,
            MessageAttributes={
                'ConnectionId': {
                    'DataType': 'String',
                    'StringValue': connection_id
                },
                'Domain': {
                    'DataType': 'String',
                    'StringValue': domain
                },
                'Stage': {
                    'DataType': 'String',
                    'StringValue': stage
                }
            },
            MessageBody=payload
        )

        print("MessageID:", sqs_response['MessageId'])

        response['statusCode'] = 204
    else:
        response['statusCode'] = 404

    return response