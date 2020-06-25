import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    
    payload=event['payload']
    print("Payload :".format(payload))
    
    outputObj={}
    if event['type']=='gateway_provision':
        print('type:')
        print(type(payload))
        try:
            dynamodb_table=getClient()
            table = dynamodb_table.Table('gateways')
            response=table.put_item(
                    Item=payload
                    )
            if response['ResponseMetadata']['HTTPStatusCode']==200:
                outputObj['statusCode']=201
                outputObj['message']="Gateway registered successfully in dynamodb"
                return outputObj
        except ClientError as error:
            outputObj['statusCode']=500
            outputObj['message']=error
            return outputObj
    
        
    elif event['type']=='censer_provision':
        dynamodb_table=getClient()
        table = dynamodb_table.Table('gateways')
        try:
            gateway_id=payload['gateway_id']
            print("Gateway id :"+gateway_id)
            gateway_response=FindGatewayByGatewayId(gateway_id)
            print(gateway_response)
            if 'Item' in gateway_response:
                gateway=gateway_response['Item']
                censers=gateway['censers']
                censers.append(payload)
                response = table.update_item(
                    Key={
                        'gateway_id': gateway_id
                    },
                    UpdateExpression="set #s = :r",
                    ExpressionAttributeNames={
                    '#s': 'censers'
                    },
                    ExpressionAttributeValues={
                        ':r': censers,
                    },
                    ReturnValues="UPDATED_NEW"
                    )
                print(response)
                if 'Attributes' in response:
                    outputObj['statusCode']=201
                    outputObj['message']="Censer registered successfully in dynamodb"
                    return outputObj
                
            
        except ClientError as error:
            outputObj['statusCode']=500
            outputObj['message']=error
            return outputObj
        



def FindGatewayByGatewayId(gateway_id):
    print(type(gateway_id))
    dynamodb_table=getClient()
    table = dynamodb_table.Table('gateways')
    response = table.get_item(
    Key={
        'gateway_id': gateway_id
        }
    )
    return response
    
    
def getClient():
    dynamodb = boto3.client('dynamodb' ,region_name='us-east-2')
    dynamodb_table = boto3.resource('dynamodb')
    return dynamodb_table