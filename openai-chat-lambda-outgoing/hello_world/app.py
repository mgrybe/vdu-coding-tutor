import logging
from datetime import datetime

import json
import openai
import os
import boto3
from string import Template

#langchain.chains.ConversationChain
from langchain.llms import OpenAI
from langchain.chains import LLMChain, ConversationChain
from langchain.prompts import PromptTemplate
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

def handle_message(config, wsClient, payload):
    #print('Handling message', config)

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

    template = Template("""
    System: You are a Python coding named PyPal tutor that always responds in the Socratic style. You *never* give the student the answer, but always try to ask just the right question to help them learn to think for themselves. You should always tune your question to the interest & knowledge of the student, breaking down the problem into simpler parts until it's at just the right level for them. If you find a bug, you should point it out to the student and ask them to fix it. You should use an informal way of communication.
    
    Current date and time: $current_date_time
    Student's full name is: '$user_name'

    Constraints:
    1. If the student asks you to give a solution, you have to reply that you cannot do so.
    2. If the student asks questions that are not related to the coding problem at hand or Python, you have to reply that you cannot answer them.
    3. You should prefer to teach simpler solutions to a coding problem first; e.g., if an algorithm has a simple brute-force algorithm, you should teach it first.
    4. Your answers must be very clear and concise.
    5. You should *never* mention about candidate solutions given below or reveal them in any way. 
    6. You should provide direct answers related to yourself or the problem statement.

    The function signature that the student will have to implement is:
    
    ```
    $signature
    ```

    You can use these candidate solutions for guiding a student:
    
    $solutions
    
    This is the coding problem:
    
    ```    
    Name: $title
    Description:
    $description
    ```

{history}
Student: {human_input}
PyPal:""").substitute(title=parsedChallenge['name'], description=parsedChallenge['description'], solutions='\n'.join(solutions), current_date_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), user_name=payload['userFullName'], signature=parsedChallenge['signature'])

    prompt = PromptTemplate(
        input_variables=["history", "human_input"],
        template=template
    )

    #llm_model = "gpt-4"

    #llm_model = "gpt-3.5-turbo"
    llm_model = os.environ["OPENAI_MODEL"]

    memory = ConversationBufferWindowMemory(k=20, ai_prefix="PyPal", human_prefix="Student")
    
    input = None
    output = None
    for message in (payload['context'][:1] + payload['context'][2:]):
        role = message['role']
        content = message['content']

        if role == 'user':
            input = content
        else:
            output = content
        
        if input is not None and output is not None:
            memory.save_context({"input": input}, {"output": output})
            input = None
            output = None

    chat = LLMChain(
        llm=ChatOpenAI(streaming=True, callbacks=[ChainStreamHandler(wsClient, config)], temperature=0.8, model_name=llm_model, stop=['Student:', 'PyPal:']),
        prompt=prompt,
        verbose=True,
        memory=memory,
    )

    user_prompt = payload['prompt']

    # Skipping the middle message (problem statement)
    #for message in (payload['context'][:1] + payload['context'][2:]):
    #    print("Adding message: ", message)
    #    role = message['role']
    #    content = message['content']

    #    if role == 'user':
    #        chat.memory.buffer_as_messages.append(HumanMessage(content=content))
    #    else:
    #        chat.memory.buffer_as_messages.append(AIMessage(content=content))

    wsClient.post_to_connection(Data='<START>', ConnectionId=config['connection_id'])

    chat.predict(human_input=user_prompt)

    wsClient.post_to_connection(Data='<FINISH>', ConnectionId=config['connection_id'])

    return 200

def lambda_handler(event, context):

    print(json.dumps(event))

    response = {'statusCode': 200}

    for record in event['Records']:
        
        payload = record["body"]
        payload = json.loads(payload)

        connection_id = record.get('messageAttributes', {}).get('ConnectionId', {}).get('stringValue')
        domain = record.get('messageAttributes', {}).get('Domain', {}).get('stringValue')
        stage = record.get('messageAttributes', {}).get('Stage', {}).get('stringValue')

        print('messageAttributes', json.dumps(record.get('messageAttributes', {})))
        print('conn_id2', connection_id)
        print('domain', domain)

        client = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{domain}/{stage}')

        try:
            handle_message({'connection_id': connection_id}, client, payload)
            #client.post_to_connection(Data='<START>', ConnectionId=connection_id)
            #client.post_to_connection(Data='<FINISH>', ConnectionId=connection_id)
        except client.exceptions.GoneException as e:
            logger.info('Connection is gone', connection_id)

    return response