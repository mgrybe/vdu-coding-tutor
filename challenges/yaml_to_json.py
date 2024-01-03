import yaml
import json
import os

for f in os.listdir("./yaml"):

    with open("./yaml/" + f, "r") as stream:
        parsedYaml = yaml.safe_load(stream)
        jsonContent = json.dumps(parsedYaml, indent=4, sort_keys=True)

        f = open("./json/" + f.replace(".yaml", ".json"), "a")
        f.write(jsonContent)
        f.close()
