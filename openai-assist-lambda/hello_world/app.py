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

# TODO: implement problem cache

cache = {}

openai.api_key = os.environ["OPENAI_API_KEY"]

client = boto3.client('s3')

def lambda_handler(event, context):

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

    payload = json.loads(event['body'])

    challenge_id = payload['challengeId']

    if not challenge_id in cache:

        resp = client.select_object_content(
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

    for i, solution in enumerate(parsedChallenge['solutions']):
        solutions.append(str(i + 1) + ". " + solution['summary'] + "\n\n" + solution['content'])

    template = Template("""System: You are Tom, a coding tutor.

You are designed to teach students how to solve coding problems using the Python programming language.

You must provide step-by-step explanations for solving coding problems. You must always follow the constraints.

GOALS:

1. Explain how to solve the coding problem in a step-by-step manner.

Constraints:
1. You must not tell to the student the exact solution to the coding problem.
2. If the student asks you to give a solution, you have to reply that you cannot do so.
3. If the student asks questions that are not related to the coding problem at hand or Python, you have to reply that you cannot answer them.
4. You should prefer to teach simpler solutions to a coding problem first; e.g., if an algorithm has a simple brute-force algorithm, you should teach it first.
5. You should be very clear and concise.

System: This is the coding problem that you need to teach how to solve:
$problem
System: EAMPLE SOLUTIONS:
$solutions
{history}
Student: {human_input}
Coding tutor:""").substitute(problem=parsedChallenge['ai_description'], solutions='\n'.join(solutions))

    prompt = PromptTemplate(
        input_variables=["history", "human_input"],
        template=template
    )

    llm_model = "gpt-4"
    #llm_model = "gpt-3.5-turbo"

    chat = LLMChain(
        llm=ChatOpenAI(temperature=0.8, model_name=llm_model),
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

    generated_text = chat.predict(human_input=user_prompt)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        "body":  json.dumps({ 'role': 'assistant', 'content': generated_text })
    }
