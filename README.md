### AWS

[Link](http://vdu-coding-tutor.s3-website-us-east-1.amazonaws.com/)

### Web app bootstrap

```
npx create-react-app web-app-v2
```

### Run API

```
# Code
sam build && sam local start-api -p 8080
# AI
sam build && sam local start-api -p 8181
# Assistant
sam build && sam local start-api -p 8282
# Problems
sam build && sam local start-api -p 8888 --profile default
```

### https://mui.com/material-ui/react-button/
https://microsoft.github.io/monaco-editor/playground.html?source=v0.36.1#example-extending-language-services-model-markers-example

https://www.linkedin.com/pulse/add-external-python-libraries-aws-lambda-using-layers-gabe-olokun/
https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
https://github.com/PyCQA/pyflakes/blob/main/pyflakes/reporter.py
https://microsoft.github.io/monaco-editor/typedoc/index.html
https://docs.python.org/3/library/subprocess.html
https://github.com/codeforgeyt/react-ws-chat-app/tree/main/src/model
https://developer.mozilla.org/en-US/docs/Web/CSS
https://mui.com/material-ui/react-alert/
https://github.com/react-monaco-editor/react-monaco-editor/issues/53
https://github.com/hamcrest/PyHamcrest
https://learnpython.com/blog/python-requirements-file/
https://restrictedpython.readthedocs.io/en/python3_update/usage/index.html

Python 3.9.16

TODO:
- Work with error handling
- Code sandboxing


CTRL + Enter = run code
```
import os

break

def sum(a, b):
    return a + b
    
print(sum(2, 2))
```

# Functionality

Testing supports [PyHamcrest](https://github.com/hamcrest/PyHamcrest) library.

```
~/workspace/openai-coding-app-master/openai-assist-lambda/.aws-sam/build/HelloWorldFunction
zip -r function.zip *
mv function.zip ../../../function.zip
```

# GPT

[API](https://platform.openai.com/docs/api-reference/chat/create)

Event

```
{
    "resource": "/code/exec",
    "path": "/code/exec",
    "httpMethod": "POST",
    "headers": {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en,en-GB;q=0.9,lt;q=0.8,lv;q=0.7,ru;q=0.6,lt-LT;q=0.5,en-US;q=0.4",
        "Authorization": "eyJraWQiOiJwam5MbFdKdGNWaUx1aFwvTU1MZng2ZDI4Q2owQkRzcngwVjU1aWVNZDRuQT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwMjc3ZDM1Mi00ZjcyLTRlMzctODRiNS0wZWU1N2IwMzlkNDkiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbVwvZXUtbm9ydGgtMV90SHVXcjJ1YkYiLCJjb2duaXRvOnVzZXJuYW1lIjoiMDI3N2QzNTItNGY3Mi00ZTM3LTg0YjUtMGVlNTdiMDM5ZDQ5Iiwib3JpZ2luX2p0aSI6IjFjMWY4NTVjLThkMWQtNGY4Ni1iMzk2LTZhZmRhM2EwNTdjNSIsImF1ZCI6IjRkbm9xMnNqZXUzazB0cnB0YzJsYTQzZGxqIiwiZXZlbnRfaWQiOiI1MDRmYTE2Ny1iM2ViLTRlYmItYjhkZS1iZDRkZTdjZDUzNWEiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY3OTQyMDIxNiwibmFtZSI6Ik1hcml1cyBHcnliZSIsImV4cCI6MTY3OTQyMzgxNSwiaWF0IjoxNjc5NDIwMjE2LCJqdGkiOiI0Y2I5MDU3Ni01NmNhLTRiMmUtODUzMC02MmIwY2FjYTQ4NWEiLCJlbWFpbCI6Im1hcml1cy5ncnliZUBnbWFpbC5jb20ifQ.mizdxNUIn23RsHkOr-E7K80YF-OFC2Po0220Iv9FygOf8QmqT6ZOTi_ypXvaxxBlbUqwG0zZD_j-TTfLDrdzvkuM0DCvrmnqXFld4a2-yQPSImI30KS58IPAgmuPwdEuNjqZIYRXca2EZ3tEkGZPYwkrWFG2xHfShHJOdFxRKCRBmCK3jTzu9aNMnNrjc80K4ey-8iYuuZ5lfHpxWD53i4bpG41GsZk-D75E4gXNRHXU4HN7TufO7PQ6uzwvNbccQcmuYAGF_1nRKydVIbvjsX7wWieiidVmdgrVO8POFMn0WYkp7xobYu7enFjt2tjn86bqknrUB-hYbvY_KoU5UA",
        "content-type": "application/json",
        "Host": "pvj4nd2rki.execute-api.eu-north-1.amazonaws.com",
        "origin": "https://d2ft9arognq9go.cloudfront.net",
        "referer": "https://d2ft9arognq9go.cloudfront.net/",
        "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "X-Amzn-Trace-Id": "Root=1-6419effa-13b4e6f36e806d550c0f4565",
        "X-Forwarded-For": "192.168.50.51, 78.61.194.254",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders": {
        "accept": [
            "*/*"
        ],
        "accept-encoding": [
            "gzip, deflate, br"
        ],
        "accept-language": [
            "en,en-GB;q=0.9,lt;q=0.8,lv;q=0.7,ru;q=0.6,lt-LT;q=0.5,en-US;q=0.4"
        ],
        "Authorization": [
            "eyJraWQiOiJwam5MbFdKdGNWaUx1aFwvTU1MZng2ZDI4Q2owQkRzcngwVjU1aWVNZDRuQT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwMjc3ZDM1Mi00ZjcyLTRlMzctODRiNS0wZWU1N2IwMzlkNDkiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbVwvZXUtbm9ydGgtMV90SHVXcjJ1YkYiLCJjb2duaXRvOnVzZXJuYW1lIjoiMDI3N2QzNTItNGY3Mi00ZTM3LTg0YjUtMGVlNTdiMDM5ZDQ5Iiwib3JpZ2luX2p0aSI6IjFjMWY4NTVjLThkMWQtNGY4Ni1iMzk2LTZhZmRhM2EwNTdjNSIsImF1ZCI6IjRkbm9xMnNqZXUzazB0cnB0YzJsYTQzZGxqIiwiZXZlbnRfaWQiOiI1MDRmYTE2Ny1iM2ViLTRlYmItYjhkZS1iZDRkZTdjZDUzNWEiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY3OTQyMDIxNiwibmFtZSI6Ik1hcml1cyBHcnliZSIsImV4cCI6MTY3OTQyMzgxNSwiaWF0IjoxNjc5NDIwMjE2LCJqdGkiOiI0Y2I5MDU3Ni01NmNhLTRiMmUtODUzMC02MmIwY2FjYTQ4NWEiLCJlbWFpbCI6Im1hcml1cy5ncnliZUBnbWFpbC5jb20ifQ.mizdxNUIn23RsHkOr-E7K80YF-OFC2Po0220Iv9FygOf8QmqT6ZOTi_ypXvaxxBlbUqwG0zZD_j-TTfLDrdzvkuM0DCvrmnqXFld4a2-yQPSImI30KS58IPAgmuPwdEuNjqZIYRXca2EZ3tEkGZPYwkrWFG2xHfShHJOdFxRKCRBmCK3jTzu9aNMnNrjc80K4ey-8iYuuZ5lfHpxWD53i4bpG41GsZk-D75E4gXNRHXU4HN7TufO7PQ6uzwvNbccQcmuYAGF_1nRKydVIbvjsX7wWieiidVmdgrVO8POFMn0WYkp7xobYu7enFjt2tjn86bqknrUB-hYbvY_KoU5UA"
        ],
        "content-type": [
            "application/json"
        ],
        "Host": [
            "pvj4nd2rki.execute-api.eu-north-1.amazonaws.com"
        ],
        "origin": [
            "https://d2ft9arognq9go.cloudfront.net"
        ],
        "referer": [
            "https://d2ft9arognq9go.cloudfront.net/"
        ],
        "sec-ch-ua": [
            "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\""
        ],
        "sec-ch-ua-mobile": [
            "?0"
        ],
        "sec-ch-ua-platform": [
            "\"macOS\""
        ],
        "sec-fetch-dest": [
            "empty"
        ],
        "sec-fetch-mode": [
            "cors"
        ],
        "sec-fetch-site": [
            "cross-site"
        ],
        "User-Agent": [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        ],
        "X-Amzn-Trace-Id": [
            "Root=1-6419effa-13b4e6f36e806d550c0f4565"
        ],
        "X-Forwarded-For": [
            "192.168.50.51, 78.61.194.254"
        ],
        "X-Forwarded-Port": [
            "443"
        ],
        "X-Forwarded-Proto": [
            "https"
        ]
    },
    "queryStringParameters": {
        "challengeId": "find_max"
    },
    "multiValueQueryStringParameters": {
        "challengeId": [
            "find_max"
        ]
    },
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "resourceId": "es0cho",
        "authorizer": {
            "claims": {
                "sub": "0277d352-4f72-4e37-84b5-0ee57b039d49",
                "email_verified": "true",
                "iss": "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_tHuWr2ubF",
                "cognito:username": "0277d352-4f72-4e37-84b5-0ee57b039d49",
                "origin_jti": "1c1f855c-8d1d-4f86-b396-6afda3a057c5",
                "aud": "4dnoq2sjeu3k0trptc2la43dlj",
                "event_id": "504fa167-b3eb-4ebb-b8de-bd4de7cd535a",
                "token_use": "id",
                "auth_time": "1679420216",
                "name": "Marius Grybe",
                "exp": "Tue Mar 21 18:36:55 UTC 2023",
                "iat": "Tue Mar 21 17:36:56 UTC 2023",
                "jti": "4cb90576-56ca-4b2e-8530-62b0caca485a",
                "email": "marius.grybe@gmail.com"
            }
        },
        "resourcePath": "/code/exec",
        "httpMethod": "POST",
        "extendedRequestId": "CJJvQGCdAi0FdVg=",
        "requestTime": "21/Mar/2023:17:57:14 +0000",
        "path": "/prod/code/exec",
        "accountId": "949118407086",
        "protocol": "HTTP/1.1",
        "stage": "prod",
        "domainPrefix": "pvj4nd2rki",
        "requestTimeEpoch": 1679421434995,
        "requestId": "d23b543d-5587-4501-bffa-cc11a70f9a90",
        "identity": {
            "cognitoIdentityPoolId": null,
            "accountId": null,
            "cognitoIdentityId": null,
            "caller": null,
            "sourceIp": "78.61.194.254",
            "principalOrgId": null,
            "accessKey": null,
            "cognitoAuthenticationType": null,
            "cognitoAuthenticationProvider": null,
            "userArn": null,
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            "user": null
        },
        "domainName": "pvj4nd2rki.execute-api.eu-north-1.amazonaws.com",
        "apiId": "pvj4nd2rki"
    },
    "body": "{\"code\":\"ZGVmIG1heGltdW0obnVtYmVycyk6CiAgcGFzcwo=\"}",
    "isBase64Encoded": false
}
```

websocat wss://rduhi5n1qd.execute-api.eu-north-1.amazonaws.com/production/
https://github.com/aws-samples/websocket-api-cognito-auth-sample/tree/main/backend
https://github.com/websockets/wscat
wscat -c 'wss://rduhi5n1qd.execute-api.eu-north-1.amazonaws.com/production' 