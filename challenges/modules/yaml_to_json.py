import yaml
import json
import os

def delete_all_files_in_directory(directory):
    # List all files in the directory
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        
        # Check if it's a file
        if os.path.isfile(file_path):
            os.remove(file_path)

delete_all_files_in_directory('./json')

for f in os.listdir("."):

    if not f.endswith('.yaml'):
        continue

    with open("./" + f, "r") as stream:
        parsedYaml = yaml.safe_load(stream)
        jsonContent = json.dumps(parsedYaml, indent=4, sort_keys=True)

        f = open("./json/" + f.replace(".yaml", ".json"), "a")
        f.write(jsonContent)
        f.close()