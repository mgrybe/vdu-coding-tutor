import boto3

def hello_s3():
    """
    Use the AWS SDK for Python (Boto3) to create an Amazon Simple Storage Service
    (Amazon S3) resource and list the buckets in your account.
    This example uses the default settings specified in your shared credentials
    and config files.
    """
    s3 = boto3.client('s3')
    bucket_name = 'vdu-coding-tutor-users'
    #objects = s3.list_objects(Bucket=bucket_name)
    #for obj in objects['Contents']:
    #    print(obj['Key'])

    try:
        response = s3.get_object(
            Bucket=bucket_name,
            Key='marius.grybe@gmail.com/solved.json',
        )
    except Exception as e:
        print("nera")

    if response is None:
        print('nothing')
    else:
        print('exists')
    print(response)

    print(response['Body'].read().decode('utf-8'))

    #response = s3.put_object(
    #    Bucket=bucket_name,
    #    Body='{\"find_max\": true}',
    #    Key='marius.grybe@gmail.com/solved.json'
    #)

if __name__ == '__main__':
    hello_s3()
