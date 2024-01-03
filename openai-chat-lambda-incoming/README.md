https://github.com/hwchase17/langchain/discussions/1706
https://python.langchain.com/en/latest/modules/callbacks/getting_started.html
https://python.langchain.com/en/latest/modules/models/llms/examples/streaming_llm.html
https://raw.githubusercontent.com/awsdocs/aws-doc-sdk-examples/main/python/cross_service/apigateway_websocket_chat/lambda_chat.py

WS tester:
https://www.piesocket.com/websocket-tester

Easy building

sam build --no-cached && cd .aws-sam/build/HelloWorldFunction && zip -r function.zip * && mv function.zip ../../../function.zip && cd ../../..