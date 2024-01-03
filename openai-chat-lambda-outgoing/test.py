import json
import os

with open('/Users/mariusgrybe/workspace/openai-coding-app-master/ui_chat.json') as f:
    file = f.read()

payload = json.loads(file)

#print(payload['context'])

for message in payload['context']:
    role = message['role']
    content = message['content']

    if role == 'user':
        role = 'Student'
    else:
        role = 'Coding tutor'
    print(role, ': ', content)
