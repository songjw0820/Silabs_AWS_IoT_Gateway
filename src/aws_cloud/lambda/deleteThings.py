import boto3
import botocore
import json
from boto3.dynamodb.conditions import Key

GATEWAY_TYPE = "gateway"
SENSOR_TYPE = "sensor"

isGatewayPolicy = False
policyName = "gateway-policy"

iot = boto3.client('iot')
response = {}

def deleteDevice(payload):
    global response
    outputObj = {}
    for data in payload:
        if(data["deviceType"] == GATEWAY_TYPE):
            print("Device type is: {}".format(GATEWAY_TYPE))
            macAddress = data["macAddress"]
            groupName = "group-" + GATEWAY_TYPE + "-" + macAddress 
            thingName = GATEWAY_TYPE + "-" + macAddress
            print("Listing associated principals with thing: {}".format(thingName))
            try:
                r = iot.list_thing_principals(thingName=thingName)
            except botocore.exceptions.ClientError as error:
                print("Error listing principals with the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured while listing thing principals"
                response["errorCode"] = error.response['Error']['Code']
                return 
            certificateArn = r['principals'][0]

            print("Detaching policy from the certificate: {}".format(certificateArn))
            try:
                iot.detach_policy(policyName=policyName, target=certificateArn)
                print("Successfully detached policy!")
            except botocore.exceptions.ClientError as error:
                print("Error detaching the policy")
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured detaching policy"
                response["errorCode"] = error.response['Error']['Code']
                return

            print("Detaching the certificate from the thing: {}".format(thingName))

            try:
                iot.detach_thing_principal(thingName=thingName, principal=certificateArn)
                print("Successfully detached certificate!")
            except botocore.exceptions.ClientError as error:
                print("Error detaching the certificate from the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured detaching the certificate from the thing"
                response["errorCode"] = error.response['Error']['Code']
                return

            certificateId=certificateArn.split('/')[1]

            print("Updating the certificate: {}".format(certificateArn))  
            try:
                iot.update_certificate(certificateId=certificateId, newStatus='INACTIVE')
                print("Successfully updated certificate to inactive!")
            except botocore.exceptions.ClientError as error:
                print("Error deleting the certificate: {}".format(certificateArn))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured updating the certificate"
                response["errorCode"] = error.response['Error']['Code']
                return


            print("Deleting the certificate: {}".format(certificateArn))
            
            try:
                iot.delete_certificate(certificateId=certificateId, forceDelete=True)
                print("Successfully deleted certificate!")
            except botocore.exceptions.ClientError as error:
                print("Error deleting the certificate: {}".format(certificateArn))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured deleting the certificate"
                response["errorCode"] = error.response['Error']['Code']
                return

            print("Deleting thing: {}".format(thingName))
            try:
                r = iot.delete_thing(thingName=thingName)
                print("Successfully deleted the thing...")
            except botocore.exceptions.ClientError as error:
                print("Error deleting the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured deleting the thing"
                response["errorCode"] = error.response['Error']['Code']
                return

            print("Deleting the group: {}".format(groupName))
            try:
                r = iot.delete_thing_group(thingGroupName=groupName)
                print("Successfully deleted the thing group: {}".format(groupName))
                response["message"] = "Successfully deleted!"
            except botocore.exceptions.ClientError as error:
                print("Error deleting the thing group: {}".format(groupName))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured deleting the group"
                response["errorCode"] = error.response['Error']['Code']
                return
            
            gateway_id = groupName
            gateway_response=checkGateway(gateway_id)
            if 'Item' in gateway_response:
                delete_gateway_response=deleteGateway(gateway_id)
                if delete_gateway_response['ResponseMetadata']['HTTPStatusCode']==200:
                    outputObj['statusCode']=200
                    outputObj['message']="Gateway deleted successfully"
                    response["db"] = outputObj   
                else:
                    outputObj['statusCode']=500
                    outputObj['message']="Internal server error"
                    response["db"] = outputObj
            else:
                outputObj['statusCode']=204
                outputObj['message']="Gateway not found in database"
                response["db"] = outputObj
            
        elif(data["deviceType"] == SENSOR_TYPE):
            print("Device type is: {}".format(SENSOR_TYPE))
            macAddress = data["macAddress"]
            groupName = data["groupName"]
            thingName = SENSOR_TYPE + "-" + macAddress
            print("Deleting thing: {}".format(thingName))
            try:
                r = iot.delete_thing(thingName=thingName)
                print("Successfully deleted the thing...")
                response["message"] = "Successfully deleted!"
            except botocore.exceptions.ClientError as error:
                print("Error deleting the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
                response["message"] = "Error Occcured deleting the thing {}".format(thingName)
                response["errorCode"] = error.response['Error']['Code']
                return
            
            
            gateway_id=groupName
            sensor_id=macAddress
            gateway_response=checkGateway(gateway_id)
            if 'Item' in gateway_response:
                print("Gateway Response: {}".format(gateway_response))
                gateway=gateway_response['Item']
                print("gateway: {}".format(gateway))
                sensors=gateway['sensors']
                print("Sensors: {}".format(sensors))
                newSensors=[]
                for i in sensors:
                    print("in for loop: ")
                    print(i)
                    if i['sensor_id']==sensor_id:
                        print("found match")
                    else:
                        newSensors.append(i)
                dynamodb_table=getClient()
                table = dynamodb_table.Table('gateways')       
                response = table.update_item(
                        Key={
                            'gateway_id': gateway_id
                        },
                        UpdateExpression="set #s = :r",
                        ExpressionAttributeNames={
                        '#s': 'sensors'
                        },
                        ExpressionAttributeValues={
                            ':r': newSensors,
                        },
                        ReturnValues="UPDATED_NEW"
                        )
                print(response)
                if 'Attributes' in response:
                    outputObj['statusCode']=201
                    outputObj['message']="Censer deleted successfully in dynamodb"
                    response["db"] = outputObj
        
    return response
    
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
    

def lambda_handler(event, context):
    # TODO implement
    body = json.loads(event['body'])
    
    ret = deleteDevice(body)
    return {
        'statusCode': 200,
        'body': json.dumps(ret)
    }
