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
    print('Return db client.....')
    return dynamodb_table
    
    
def addToDB(payload, deviceType):
    outputObj={}
    print('Payload: {}'.format(payload))
    if(deviceType == GATEWAY_TYPE):
        print('in if')
        print(type(payload))
        try:
            dynamodb_table=getClient()
            table = dynamodb_table.Table('gateways')
            response=table.put_item(
                    Item=payload
                    )
            print("Response: {}".format(response))
            if response['ResponseMetadata']['HTTPStatusCode']==200:
                outputObj['statusCode']=201
                outputObj['message']="Gateway registered successfully in dynamodb"
                return outputObj
        except botocore.exceptions.ClientError as error:
            print("Exception in dbData")
            print("Error: {}".format(error))
            outputObj['statusCode']=500
            outputObj['message']=error
            return outputObj
            
    elif (deviceType == SENSOR_TYPE):
        dynamodb_table=getClient()
        table = dynamodb_table.Table('gateways')
        try:
            gateway_id=payload['gateway_id']
            print("Gateway id :"+gateway_id)
            payload.pop('gateway_id')
            gateway_response=FindGatewayByGatewayId(gateway_id)
            print(gateway_response)
            if 'Item' in gateway_response:
                gateway=gateway_response['Item']
                sensors=gateway['sensors']
                sensors.append(payload)
                response = table.update_item(
                    Key={
                        'gateway_id': gateway_id
                    },
                    UpdateExpression="set #s = :r",
                    ExpressionAttributeNames={
                    '#s': 'sensors'
                    },
                    ExpressionAttributeValues={
                        ':r': sensors,
                    },
                    ReturnValues="UPDATED_NEW"
                    )
                print(response)
                if 'Attributes' in response:
                    outputObj['statusCode']=201
                    outputObj['message']="Sensors registered successfully in dynamodb"
                    return outputObj
        except botocore.exceptions.ClientError as error:
            print("Exception in dbData")
            print("Error: {}".format(error))
            outputObj['statusCode']=500
            outputObj['message']=error
            return outputObj

def createDevice(payload):
    response["thing"] = []
    for data in payload:
        if(data["deviceType"] == GATEWAY_TYPE):
            print("Device type is: {}".format(GATEWAY_TYPE))
            macAddress = data["macAddress"]
            groupName = "group-"+GATEWAY_TYPE+"-"+macAddress
            print("Creating group.....\nGroup name: {}".format(groupName))
            try:
                r = iot.create_thing_group(thingGroupName=groupName)
                print("Successfully created thing group!")
                response["group"] = r
            except botocore.exceptions.ClientError as error:
                if error.response['Error']['Code']  == 'ResourceAlreadyExistsException':
                    print(error.response['Error']['Code'])
                    print('Thing Group already exists')
                    return
            groupArn = r['thingGroupArn']
            print("Group ARN: {}".format(groupArn))
            print("Attaching policy with the group: {}".format(groupArn))
            try:
                r = iot.attach_policy(policyName=policyName, target=groupArn)
                print("Successfully attached policy with the group!")
            except botocore.exceptions.ClientError as error:
                print("Error attaching the policy: {0} to the group: {1}".format(policyName, groupName))
                print(error.response['Error']['Code'])

            thingName = data["deviceType"] + "-" + data["macAddress"]

            print("Creating thing: {}".format(thingName))
            try:
                r = iot.create_thing(thingName=thingName, thingTypeName=GATEWAY_TYPE)
                print("Thing: {} created successfully!".format(thingName))
                response["thing"] = r
            except botocore.exceptions.ClientError as error:
                print("Error creating the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
        
            print("Attaching the thing with the group: {}".format(groupName))

            try:
                r = iot.add_thing_to_thing_group(thingName=thingName, thingGroupName=groupName)
                print("Successfully attached the thing: {0} with the group: {1}".format(thingName, groupName))
            except botocore.exceptions.ClientError as error:
                print("Error adding the thing: {} to the group: {}".format(thingName, groupName))
                print(error.response['Error']['Code'])

            print("Creating certificates....")

            try:
                r = iot.create_keys_and_certificate(setAsActive=True)
                print("Successfully created certificates!")
                response["certificates"] = r
                certificateArn = r['certificateArn']
            except botocore.exceptions.ClientError as error:
                print("Error creating certificates.")
                print(error.response['Error']['Code'])
                return            

            print("Attaching policy with the certificate...")

            try:
                r = iot.attach_policy(policyName=policyName, target=certificateArn)
                print("Successfully attached the policy!")
            except botocore.exceptions.ClientError as error:
                print("Error attaching the policy to certificates.")
                print(error.response['Error']['Code'])
                return

            print("Attaching the created certificates with the thing: {}".format(thingName))

            try:
                r = iot.attach_thing_principal(thingName=thingName, principal=certificateArn)
                print("Successfully attached the certificate to thing: {}".format(thingName))
            except botocore.exceptions.ClientError as error:
                print("Error attaching certificates to the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
                return
            
            print("Getting endpoint details....")

            try:
                r = iot.describe_endpoint(endpointType="iot:Data-ATS")
                response["endpoint"] = r
            except botocore.exceptions.ClientError as error:
                print("Error attaching the policy to certificates.")
                print(error.response['Error']['Code'])
                return
            
            dbData = {}
            dbData["user_id"] = data["userId"] 
            dbData["gateway_id"] = groupName
            dbData["mac_id"] = data["macAddress"]
            dbData["gateway_name"] = groupName
            dbData["sensors"] = []
            
            r = addToDB(dbData, GATEWAY_TYPE)
            response["db"] = r
            
        elif(data["deviceType"] == SENSOR_TYPE):
            print("Device type is: {}".format(SENSOR_TYPE))
            macAddress = data["macAddress"]
            groupName = data["groupName"]
            
            thingName = data["deviceType"] + "-" + data["macAddress"]

            print("Creating thing: {}".format(thingName))
            try:
                r = iot.create_thing(thingName=thingName, thingTypeName=SENSOR_TYPE)
                print("Thing: {} created successfully!".format(thingName))
                r["macAddress"] = macAddress
                response["thing"].append(r)
            except botocore.exceptions.ClientError as error:
                print("Error creating the thing: {}".format(thingName))
                print(error.response['Error']['Code'])
        
            print("Attaching the thing with the group: {}".format(groupName))

            try:
                r = iot.add_thing_to_thing_group(thingName=thingName, thingGroupName=groupName)
                print("Successfully attached the thing: {0} with the group: {1}".format(thingName, groupName))
            except botocore.exceptions.ClientError as error:
                print("Error adding the thing: {} to the group: {}".format(thingName, groupName))
                print(error.response['Error']['Code'])
            
            dbData = {}
            dbData["gateway_id"] = groupName
            dbData["mac_id"] = macAddress
            dbData["name"] = thingName
            dbData["sensor_id"] = macAddress
            
            r = addToDB(dbData, SENSOR_TYPE)
            response["db"] = r
                
                
    return response

            
            

def checkThingTypes():
    isSensorDevice = False
    isGateway = False
    r = iot.list_thing_types()
    #print(r)
    for thingType in enumerate(r['thingTypes']):
        if(thingType[1]['thingTypeName'] == GATEWAY_TYPE):
            print('Gateway thing type exists')
            isGateway = True
        elif(thingType[1]['thingTypeName'] == SENSOR_TYPE):
            print('Sensor thing exists')
            isSensorDevice = True

    if(not isGateway):
        print("Creating Gateway thing type")
        r = iot.create_thing_type(thingTypeName=GATEWAY_TYPE)
        if(r['ResponseMetadata']['HTTPStatusCode'] == 200):
            print("Successfully created gateway thing type")
        else:
            print("Error Creating gateway thing type")
            print("HTTPResponseCode: "+r['ResponseMetadata']['HTTPStatusCode'])

    if(not isSensorDevice):
        print("Creating sensor thing type")
        r = iot.create_thing_type(thingTypeName=SENSOR_TYPE)
        if(r['ResponseMetadata']['HTTPStatusCode'] == 200):
            print("Successfully created sensor thing type")
        else:
            print("Error Creating gateway thing type")
            print("HTTPResponseCode: "+r['ResponseMetadata']['HTTPStatusCode'])

def createPolicy():
    policyDocument = "{ \"Version\": \"2012-10-17\",\"Statement\": [{ \"Effect\": \"Allow\", \"Action\": \"iot:*\", \"Resource\": \"*\"}]}"
    global policyName
    r = iot.create_policy(policyName=policyName, policyDocument=policyDocument)
    return r

def checkPolicies():
    global policyName
    global isGatewayPolicy
    listPoliciesResponse = iot.list_policies()
    for policy in enumerate(listPoliciesResponse['policies']):
        #print(policy)
        if(policy[1]["policyName"] == policyName):
            isGatewayPolicy = True

    if(isGatewayPolicy):
        print("Gateway Policy Exists")
    else:
        print("Gateway policy does not exist. Creating a new policy")
        r = createPolicy()
        if(r['ResponseMetadata']['HTTPStatusCode'] == 200):
            print("Created new policy successfully")
        else:
            print("Error creating new policy")
            print("Response Code: "+r['ResponseMetadata']['HTTPStatusCode'])
        #print(r)
        response['policy'] = r


def lambda_handler(event, context):
    # TODO implement
    checkPolicies()
    checkThingTypes()
    body = json.loads(event['body'])
    global response
    response = {}
    r = createDevice(body)
    return {
        'statusCode': 200,
        'body': json.dumps(r)
    }
