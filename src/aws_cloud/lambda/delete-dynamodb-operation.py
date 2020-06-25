import json
import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    payload=event['payload']
    outputObj={}
    
    if event['type']=='gateway_deletion':
        gateway_response=checkGateway(payload['gateway_id'])
        if 'Item' in gateway_response:
            delete_gateway_response=deleteGateway(payload['gateway_id'])
            if delete_gateway_response['ResponseMetadata']['HTTPStatusCode']==200:
                outputObj['statusCode']=200
                outputObj['message']="Gateway deleted successfully"
                return outputObj   
            else:
                outputObj['statusCode']=500
                outputObj['message']="Internal server error"
                return outputObj
        else:
            outputObj['statusCode']=204
            outputObj['message']="Gateway not found in database"
            return outputObj

    elif event['type']=='censer_deletion':
        gateway_id=payload['gateway_id']
        censer_id=payload['censer_id']
        gateway_response=checkGateway(payload['gateway_id'])
        if 'Item' in gateway_response:
            gateway=gateway_response['Item']
            censers=gateway['censers']
            newCensers=[]
            for i in censers:
                if i['censer_id']==censer_id:
                    print("found match")
                else:
                    newCensers.append(i)
            dynamodb_table=getClient()
            table = dynamodb_table.Table('gateways')       
            response = table.update_item(
                    Key={
                        'gateway_id': gateway_id
                    },
                    UpdateExpression="set #s = :r",
                    ExpressionAttributeNames={
                    '#s': 'censers'
                    },
                    ExpressionAttributeValues={
                        ':r': newCensers,
                    },
                    ReturnValues="UPDATED_NEW"
                    )
            print(response)
            if 'Attributes' in response:
                outputObj['statusCode']=201
                outputObj['message']="Censer deleted successfully in dynamodb"
                return outputObj
            
            
            
        
        

def checkGateway(gateway_id):
    dynamodb_table=getClient()
    table = dynamodb_table.Table('gateways')
    response = table.get_item(
        Key={
        'gateway_id':gateway_id
        }
        )
    return response
    
def deleteGateway(gateway_id):
    dynamodb_table=getClient()
    table = dynamodb_table.Table('gateways')
    response = table.delete_item(
        Key={
            'gateway_id':gateway_id,
            }
        )
    return response
    
def getClient():
    dynamodb = boto3.client('dynamodb' ,region_name='us-east-2')
    dynamodb_table = boto3.resource('dynamodb')
    return dynamodb_table