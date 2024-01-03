import yaml
import json
import os

first = True
with open("./json/modules.json", "w") as output:
    output.write("{ \"modules\": [")
    for f in os.listdir("./"):

        if not f.endswith('.yaml'):
            continue

        with open("./" + f, "r") as stream:
            parsedYaml = yaml.safe_load(stream)
            jsonContent = json.dumps(parsedYaml)

            if not first:
                output.write(",")

            output.write(jsonContent)

            first = False
    output.write("]}")
