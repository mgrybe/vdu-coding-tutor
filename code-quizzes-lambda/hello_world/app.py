import json
import boto3
import uuid
from datetime import datetime, timezone


class Option:
    def __init__(self, id, option, correct):
        self.id = id
        self.option = option
        self.correct = correct


class Question:
    def __init__(self, id, type, question, score, options):
        self.id = id
        self.type = type
        self.question = question
        self.score = score
        self.options = options


class Quizz:
    def __init__(self, id, version, title, passingScore, questions):
        self.id = id
        self.version = version
        self.title = title
        self.passingScore = passingScore
        self.questions = questions


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

    if httpPath == "/quizzes":
        result = {}

        if httpMethod == "GET":
            quizzId = None

            if event["queryStringParameters"]:
                quizzId = event["queryStringParameters"]["quizzId"]

            if quizzId:
                found = False

                if event["queryStringParameters"].get("detailLevel", None) == "FULL":
                    try:
                        response = client.get_object(
                            Bucket="vdu-coding-tutor-quizzes",
                            Key="quizzes/" + quizzId + ".json",
                        )

                        result = json.loads(response["Body"].read().decode("utf-8"))

                        print("found quizz by id", json.dumps(result))

                        found = True
                    except client.exceptions.NoSuchKey as e:
                        # Handle the case where the object does not exist
                        pass
                    except Exception as e:
                        # Does not exist
                        # TODO: ignore only if file does not exist
                        raise
                elif event["queryStringParameters"].get("detailLevel", None) == "BASIC":
                    
                    last_solution = {}
                    
                    try:
                        response = client.get_object(
                            Bucket="vdu-coding-tutor-users",
                            Key=user + "/quizzes/" + quizzId + ".json",
                        )
            
                        last_solution = json.loads(response["Body"].read().decode("utf-8"))
                    except client.exceptions.NoSuchKey as e:
                        # Handle the case where the object does not exist
                        pass
                    except client.exceptions.AccessDenied as e:
                        pass
                    except Exception as e:
                        # Handle any other exceptions
                        raise
                    
                    print('last_solution', json.dumps(last_solution))
                    
                    try:
                        response = client.get_object(
                            Bucket="vdu-coding-tutor-quizzes",
                            Key="quizzes/" + quizzId + ".json",
                        )
    
                        result = json.loads(response["Body"].read().decode("utf-8"))
                        result['solved'] = last_solution.get('solved', False)
                        
                        for question in result['questions']:
                            for option in question['options']:
                                if last_solution.get('solved', False):
                                    
                                    solved_question = {}
                                    for q in last_solution['solution']['questions']:
                                        if q['id'] == question['id']:
                                            solved_question = q
                                            break
                                        
                                    #solved_option = None
                                    for o in solved_question.get('options', []):
                                        if o['id'] == option['id']:
                                            option['correct'] = o['correct']
                                        
                                    #option['correct'] = last_solution['solution']['questions'][question['id']][option['id']]['correct']
                                else:
                                    del option['correct']
    
                        print("found quizz by id", json.dumps(result))
    
                        found = True
                    except client.exceptions.NoSuchKey as e:
                        # Handle the case where the object does not exist
                        pass
                    except Exception as e:
                        # Does not exist
                        # TODO: ignore only if file does not exist
                        raise
                else:
                    resp = client.select_object_content(
                        Bucket="vdu-coding-tutor-quizzes",
                        Key="quizzes.json",
                        Expression="""SELECT s.id, s.version, s.title FROM S3Object[*].quizzes[*] s WHERE s.id = '""" + quizzId + """'""",
                        ExpressionType="SQL",
                        InputSerialization={"JSON": {"Type": "DOCUMENT"}},
                        OutputSerialization={"JSON": {"RecordDelimiter": ","}},
                    )

                    for event in resp["Payload"]:
                        if "Records" in event:
                            content = event["Records"]["Payload"].decode()
                            for quizz in json.loads(
                                "[" + content[0 : len(content) - 1] + "]"
                            ):
                                result = quizz
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

                #finished = {"quizzes": {}}

                #try:
                #    response = client.get_object(
                #        Bucket="vdu-coding-tutor-users",
                #        Key=user + "/finished.json",
                #    )
                #
                #    finished = json.loads(response["Body"].read().decode("utf-8"))
                #except client.exceptions.NoSuchKey as e:
                #    # Handle the case where the object does not exist
                #    pass
                #except Exception as e:
                #    # Does not exist
                #    # TODO: ignore only if file does not exist
                #    raise
                #
                #result["finished"] = finished.get("quizzes", {}).get(quizzId, None)
            else:
                finished = {"quizzes": {}}

                try:
                    response = client.get_object(
                        Bucket="vdu-coding-tutor-users",
                        Key=user + "/finished.json",
                    )
        
                    finished = json.loads(response["Body"].read().decode("utf-8"))
                except client.exceptions.NoSuchKey as e:
                    # Handle the case where the object does not exist
                    pass
                except Exception as e:
                    # Handle any other exceptions
                    raise

                resp = client.select_object_content(
                    Bucket="vdu-coding-tutor-quizzes",
                    Key="quizzes.json",
                    Expression="""SELECT s.id, s.version, s.title, s.passingScore, s.totalScore FROM S3Object[*].quizzes[*] s""",
                    ExpressionType="SQL",
                    InputSerialization={"JSON": {"Type": "DOCUMENT"}},
                    OutputSerialization={"JSON": {"RecordDelimiter": ","}},
                )

                quizzes = []
                for event in resp["Payload"]:
                    if "Records" in event:
                        content = event["Records"]["Payload"].decode()
                        for quizz in json.loads("[" + content[0 : len(content) - 1] + "]"):
                            quizz["solved"] = finished.get("quizzes", {}).get(quizz['id'], False)
                            #quizz["score"] = finished.get("quizzes", {}).get(quizz['id'], {}).get('score', 0)
                            quizzes.append(quizz)

                result["quizzes"] = quizzes
        elif httpMethod == "POST":
            payload = json.loads(event["body"])
            # Adding the timestamp using millisecond precision
            payload["version"] = str(int(datetime.utcnow().timestamp() * 1000))

            # TODO: validate the payload here
            if "id" not in payload:
                payload["id"] = str(uuid.uuid4())
                
            # Adding IDs to all questions and options
            for question in payload['questions']:
                if "id" not in question:
                    question["id"] = str(uuid.uuid4())
                
                for option in question['options']:
                    if "id" not in option:
                        option["id"] = str(uuid.uuid4())

            # Creating a new module
            response = client.put_object(
                Bucket="vdu-coding-tutor-quizzes",
                Body=json.dumps(payload),
                Key="quizzes/" + payload["id"] + ".json",
            )

            result = payload

        elif httpMethod == "DELETE":
            quizzId = event["queryStringParameters"]["quizzId"]

            sqs_response = sqsClient.send_message(
                QueueUrl="https://sqs.eu-north-1.amazonaws.com/949118407086/vdu-s3-quizzes-queue.fifo",
                DelaySeconds=0,
                MessageGroupId="quizzes-group",
                MessageDeduplicationId=quizzId,
                MessageBody=json.dumps(
                    {
                        "action": "DELETE",
                        "s3": {
                            "bucket": "vdu-coding-tutor-quizzes",
                            "key": "quizzes/" + quizzId + ".json",
                        },
                    }
                ),
            )

            result = quizzId

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
        
    elif httpPath == "/quizzes/solution" and httpMethod == "POST":
        
        quizzId = event["queryStringParameters"]["quizzId"]
        
        solution_audit = {}
        
        try:
            response = client.get_object(
                Bucket="vdu-coding-tutor-users",
                Key=user + "/quizzes/" + quizzId + ".json",
            )

            solution_audit = json.loads(response["Body"].read().decode("utf-8"))
        except client.exceptions.NoSuchKey as e:
            # Handle the case where the object does not exist
            pass
        except Exception as e:
            # Does not exist
            # TODO: ignore only if file does not exist
            raise
        
        response = client.get_object(
            Bucket="vdu-coding-tutor-quizzes",
            Key="quizzes/" + quizzId + ".json",
        )

        quizz = json.loads(response["Body"].read().decode("utf-8"))
        solution = json.loads(event["body"])
        
        result = {}
        
        passing_score = float(quizz['passingScore'])
        actual_score = 0
        invalid_questions = []
        
        for question in quizz['questions']:
            question_id = question['id']
            score = float(question['score'])
            
            expected_solution = []
            for option in question['options']:
                expected_solution.append({
                    'id': option['id'],
                    'correct': option['correct']
                })
                
            actual_solution = []
            for option in list(filter(lambda obj: obj['id'] == question_id, solution['questions']))[0]['options']:
                actual_solution.append({
                    'id': option['id'],
                    'correct': option['correct']
                })
            
            print('expected_solution', expected_solution)
            print('actual_solution', actual_solution)
            
            if expected_solution == actual_solution:
                actual_score += score
            else:
                invalid_questions.append(question_id)
                
        print('passing_score', passing_score)
        print('actual_score', actual_score)
        
        solution_audit['lastAttemptedAt'] = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()
        solution_audit['score'] = actual_score
        solution_audit['solution'] = solution
        solution_audit['solved'] = (actual_score >= passing_score)
        
        response = client.put_object(
            Bucket="vdu-coding-tutor-users",
            Key=user + "/quizzes/" + quizzId + ".json",
            Body=json.dumps(solution_audit)
        )
        
        if actual_score >= passing_score:

            finished = {
                'quizzes': {}
            }
            
            try:
                response = client.get_object(
                    Bucket="vdu-coding-tutor-users",
                    Key=user + "/finished.json",
                )
    
                finished = json.loads(response["Body"].read().decode("utf-8"))
            except client.exceptions.NoSuchKey as e:
                # Handle the case where the object does not exist
                pass
            except Exception as e:
                # Handle any other exceptions
                raise
            
            if 'quizzes' not in finished:
                finished['quizzes'] = {}
            
            finished['quizzes'][quizzId] = solution_audit
            
            print('finished', json.dumps(finished))
            
            try:
                response = client.put_object(
                    Bucket="vdu-coding-tutor-users",
                    Key=user + "/finished.json",
                    Body=json.dumps(finished)
                )
            except client.exceptions.NoSuchKey as e:
                # Handle the case where the object does not exist
                pass
            except Exception as e:
                # Handle any other exceptions
                raise
            
            result['solved'] = True
        else:
            result['solved'] = False
         
        result['invalidQuestions'] = invalid_questions
        result['score'] = actual_score
        
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
