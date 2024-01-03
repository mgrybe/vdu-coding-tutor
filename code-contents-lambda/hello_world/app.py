import json
import boto3
import uuid
from datetime import datetime, timezone

#class Content:
#
#    def __init__(self, id, title, content, tags):
#        self.id = id
#        self.title = title
#        self.content = content
#        self.tags = tags

client = boto3.client("s3")
sqsClient = boto3.client("sqs")


def lambda_handler(event, context):
    print(json.dumps(event))

    httpMethod = event["httpMethod"]
    httpPath = event["path"]

    if httpMethod == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        }

    user = event["requestContext"]["authorizer"]["claims"]["email"]

    if httpPath == "/contents":
        result = {}

        if httpMethod == "GET":
            contentId = None

            if event["queryStringParameters"]:
                contentId = event["queryStringParameters"]["contentId"]

            if contentId:
                found = False

                if event["queryStringParameters"].get("detailLevel", None) == "FULL":
                    try:
                        response = client.get_object(
                            Bucket="vdu-coding-tutor-content",
                            Key="content/" + contentId + ".json",
                        )

                        result = json.loads(response["Body"].read().decode("utf-8"))

                        print("found content by id", json.dumps(result))

                        found = True
                    except client.exceptions.NoSuchKey as e:
                        # Handle the case where the object does not exist
                        pass
                    except Exception as e:
                        # Does not exist
                        # TODO: ignore only if file does not exist
                        pass
                else:
                    resp = client.select_object_content(
                        Bucket="vdu-coding-tutor-content",
                        Key="contents.json",
                        Expression="""SELECT s.id, s.version, s.title, s.tags FROM S3Object[*].contents[*] s WHERE s.id = '""" + contentId + """'""",
                        ExpressionType="SQL",
                        InputSerialization={"JSON": {"Type": "DOCUMENT"}},
                        OutputSerialization={"JSON": {"RecordDelimiter": ","}},
                    )

                    for event in resp["Payload"]:
                        if "Records" in event:
                            cont = event["Records"]["Payload"].decode()
                            for cont in json.loads("[" + cont[0 : len(cont) - 1] + "]"):
                                result = cont
                                found = True

                if not found:
                    return {
                        "statusCode": 404,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "*",
                        },
                        "body": json.dumps({}),
                    }
            else:
                resp = client.select_object_content(
                    Bucket="vdu-coding-tutor-content",
                    Key="contents.json",
                    Expression="""SELECT s.id, s.version, s.title, s.tags FROM S3Object[*].contents[*] s""",
                    ExpressionType="SQL",
                    InputSerialization={"JSON": {"Type": "DOCUMENT"}},
                    OutputSerialization={"JSON": {"RecordDelimiter": ","}},
                )

                contents = []
                for event in resp["Payload"]:
                    if "Records" in event:
                        content = event["Records"]["Payload"].decode()
                        for cont in json.loads("[" + content[0 : len(content) - 1] + "]"):
                            #content["solved"] = finished.get("quizzes", {}).get(content['id'], False)
                            #quizz["score"] = finished.get("quizzes", {}).get(quizz['id'], {}).get('score', 0)
                            contents.append(cont)

                result["contents"] = contents
        elif httpMethod == "POST":
            payload = json.loads(event["body"])
            # Adding the timestamp using millisecond precision
            payload["version"] = str(int(datetime.utcnow().timestamp() * 1000))

            # TODO: validate the payload here
            if "id" not in payload:
                payload["id"] = str(uuid.uuid4())

            # Creating a new module
            response = client.put_object(
                Bucket="vdu-coding-tutor-content",
                Body=json.dumps(payload),
                Key="contents/" + payload["id"] + ".json",
            )

            result = payload

        elif httpMethod == "DELETE":
            contentId = event["queryStringParameters"]["contentId"]

            sqs_response = sqsClient.send_message(
                QueueUrl="https://sqs.eu-north-1.amazonaws.com/949118407086/vdu-s3-contents-queue.fifo",
                DelaySeconds=0,
                MessageGroupId="contents-group",
                MessageDeduplicationId=contentId,
                MessageBody=json.dumps(
                    {
                        "action": "DELETE",
                        "s3": {
                            "bucket": "vdu-coding-tutor-content",
                            "key": "contents/" + contentId + ".json",
                        },
                    }
                ),
            )

            result = contentId

        response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            "body": json.dumps(result),
        }

        return response
        
    response = {
        "statusCode": 404,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps({}),
    }

    return response


# sam build --no-cached && cd .aws-sam/build/HelloWorldFunction && zip -r function.zip * && mv function.zip ../../../function.zip && cd ../../..
