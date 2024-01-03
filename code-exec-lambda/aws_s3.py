import boto3

def hello_s3():
    """
    Use the AWS SDK for Python (Boto3) to create an Amazon Simple Storage Service
    (Amazon S3) resource and list the buckets in your account.
    This example uses the default settings specified in your shared credentials
    and config files.
    """
    s3 = boto3.client('s3')
    bucket_name = 'vdu-coding-tutor-problems'
    objects = s3.list_objects(Bucket=bucket_name)
    for obj in objects['Contents']:
        print(obj['Key'])

if __name__ == '__main__':
    hello_s3()
