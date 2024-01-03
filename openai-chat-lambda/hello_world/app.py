import logging
from datetime import datetime

import json
import openai
import os
import boto3
from string import Template

from langchain import OpenAI, ConversationChain, LLMChain, PromptTemplate
from langchain.memory import ConversationBufferWindowMemory
from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
)
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cache = {}

openai.api_key = os.environ["OPENAI_API_KEY"]

s3Client = boto3.client('s3')

class ChainStreamHandler(StreamingStdOutCallbackHandler):
    def __init__(self, wsClient, config):
        super().__init__()
        self.wsClient = wsClient
        self.config = config

    def on_llm_new_token(self, token: str, **kwargs):
        self.wsClient.post_to_connection(Data=token, ConnectionId=self.config['connection_id'])

def handle_connect():
    print('Handling connect')
    return 200

def handle_disconnect():
    print('Handling disconnect')
    return 200

def handle_message(config, wsClient, payload):
    print('Handling message', config)

    challenge_id = payload['challengeId']

    if not challenge_id in cache:

        resp = s3Client.select_object_content(
            Bucket = 'vdu-coding-tutor-problems',
            Key = 'problems.json',
            Expression = """SELECT s.* FROM S3Object[*].problems[*] s WHERE s.id = '""" + challenge_id + """'""",
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

        cache[challenge_id] = parsedChallenge
    else:
        parsedChallenge = cache[challenge_id]

    solutions = []

    for i, solution in enumerate(parsedChallenge.get('solutions', [])):
        solutions.append(str(i + 1) + ". " + solution['summary'] + "\n\n" + solution['content'])

    template = Template("""System: You are a Python coding tutor that always responds in the Socratic style. You *never* give the student the answer, but always try to ask just the right question to help them learn to think for themselves. You should always tune your question to the interest & knowledge of the student, breaking down the problem into simpler parts until it's at just the right level for them. Also, each time you provide a code snippet, check that it actually works by going through it step-by-step. If you find a bug, you should point it out to the student and ask them to fix it.
    
    Current date and time: $current_date_time
    User's name is: '$user_name'
    
    This is the coding problem:
    
Name: $title
Description:
$description

This problem has these solutions that you can use as a reference:
$solutions

Constraints:
1. If the student asks you to give a solution, you have to reply that you cannot do so.
2. If the student asks questions that are not related to the coding problem at hand or Python, you have to reply that you cannot answer them.
3. You should prefer to teach simpler solutions to a coding problem first; e.g., if an algorithm has a simple brute-force algorithm, you should teach it first.
4. Your answers must be very clear and concise.

Coding tutor: I am here to help you solve the '$title' coding problem.{history}
Student: {human_input}
Coding tutor:""").substitute(title=parsedChallenge['name'], description=parsedChallenge['description'], solutions='\n'.join(solutions), current_date_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), user_name='Marius')

    prompt = PromptTemplate(
        input_variables=["history", "human_input"],
        template=template
    )

    llm_model = "gpt-4"


    #llm_model = "gpt-3.5-turbo"

    chat = LLMChain(
        llm=ChatOpenAI(streaming=True, callbacks=[ChainStreamHandler(wsClient, config)], temperature=0.8, model_name=llm_model),
        prompt=prompt,
        verbose=True,
        memory=ConversationBufferWindowMemory(k=20, ai_prefix="Coding tutor", human_prefix="Student"),
    )

    user_prompt = payload['prompt']

    # Skipping the first message, since it is fixed
    for message in payload['context'][1:]:
        role = message['role']
        content = message['content']

        if role == 'user':
            chat.memory.buffer.append(HumanMessage(content=content))
        else:
            chat.memory.buffer.append(AIMessage(content=content))

    wsClient.post_to_connection(Data='<START>', ConnectionId=config['connection_id'])

    chat.predict(human_input=user_prompt)

    wsClient.post_to_connection(Data='<FINISH>', ConnectionId=config['connection_id'])

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
        payload = json.loads(payload)

        connection_id = event.get('requestContext', {}).get('connectionId')
        domain = event.get('requestContext', {}).get('domainName')
        stage = event.get('requestContext', {}).get('stage')

        client = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{domain}/{stage}')

        response['statusCode'] = handle_message({'connection_id': connection_id}, client, payload)
    else:
        response['statusCode'] = 404

    return response