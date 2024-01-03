import json
import os

with open('/Users/mariusgrybe/workspace/openai-coding-app-master/ui_problem.json') as f:
    file = f.read()

payload = json.loads(file)

#print(payload['context'])

print(payload['ai_description'])
print(payload['solutions'])

solutions = []

for i, solution in enumerate(payload['solutions']):
    solutions.append(str(i + 1) + ". " + solution['summary'] + "\n\n" + solution['content'])

print('\n'.join(solutions))