import yaml
import json
import os

first = True
with open("./json/problems.json", "a") as output:
    output.write("{ \"problems\": [")
    for f in os.listdir("./yaml"):

        with open("./yaml/" + f, "r") as stream:
            parsedYaml = yaml.safe_load(stream)
            jsonContent = json.dumps(parsedYaml)

            if not first:
                output.write(",")

            output.write(jsonContent)

            first = False
    output.write("]}")
