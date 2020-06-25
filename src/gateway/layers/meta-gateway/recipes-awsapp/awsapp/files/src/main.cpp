#include "aws-iot-core-class.hpp"
#include "aws-iot-device-class.hpp"
#include "mqtt-handlers.h"
//#include "rapidjson/document.h"

#define mqtt_host "localhost"
#define mqtt_port 1883

//#define MQTT_SUB_CREATE_THING      "awsapp/gw/+/create/thing"

// #### Global variables defination ####

AWSIoTCore* core;
AWSIoTDevice* device;
struct mosquitto *mosq = NULL;
rapidjson::Document document;
std::string groupName = "";

// #####################################

void message_callback(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message)
{
	bool match = 0;
	int i, status;

	LOG_INFO("got message '%.*s' for topic '%s'\n", message->payloadlen, (char*) message->payload, message->topic);


	for ( i = 0; i < NUMBER_OF_FUNCTION ; i++) {

                mosquitto_topic_matches_sub((const char *) mosquitto_message_handler_array[i].mosquitto_topic, message->topic, &match);
                if (match) {
                        status = mosquitto_message_handler_array[i].handler(mosq,message);
                        if ( status == -1)
                        {
                                LOG_ERROR("Failed to handle message on topic :: %s\n", message->topic);
                        }
                        break;
                }
        }


	/*mosquitto_topic_matches_sub("/devices/wb-adc/controls/+", message->topic, &match);
	if (match) {
		LOG_INFO("got message for ADC topic");
	}*/

}
void connect_callback(struct mosquitto *mosq, void *obj, int result)
{
        int l_count = 0;
        int status = MOSQ_ERR_INVAL;

        if ( result == 0 ) {
                LOG_INFO("Sucessfully connects to mosquitto service");
        } else {
                LOG_ERROR("Failed to connects mosquitto service");
        }

        if ( mosq == NULL ){
                 LOG_ERROR("Invalid pointer");
                return;
        }
        for ( l_count = MQTT_TYPE_MIN ; l_count < MQTT_TYPE_MAX ; l_count++){

                status = mosquitto_subscribe(mosq, NULL, mqtt_topic_subscribe[l_count], 0);
                if ( status != MOSQ_ERR_SUCCESS){
                       LOG_ERROR("could not subscribe to topic:%s err:%d", mqtt_topic_subscribe[l_count], status);
                        /* TODO : If any topic failed to subscribe then restart mosquitto and all services*/
                }
                LOG_INFO("Subscribe to topic : %s\n",mqtt_topic_subscribe[l_count]);
        }
        // Request selene to provide already provisioned device list
        /*status = mosquitto_publish(mosq, NULL, MQTT_PUB_SELENE_REQUEST, strlen(deviceListCommand), deviceListCommand, 1, false);
        if ( status != MOSQ_ERR_SUCCESS){
                logBtGattErr("could not publish to topic:%s err:%d", MQTT_PUB_SELENE_REQUEST, status);
                return;
        }*/
        //logBtGattInfo ("Successfully publish payload to get deviceList from selene on topic %s\n", MQTT_PUB_SELENE_REQUEST);
}

int telemetry(struct mosquitto *mosq, const struct mosquitto_message *message)
{
	LOG_INFO("Received message for telemetry: %s", (char *)message->payload);
	auto thingName = core->ReadConfigFile("thingName");
	//auto topicName = std::string(thingName.c_str()) + "/telemetry"; 
	auto topicName = std::string("gateway/") + std::string(thingName.c_str()) + "/telemetry"; 
	LOG_INFO("Publishing message to topic: %s", topicName.c_str());
	auto rc = device->Publish(topicName.c_str(), (char *)message->payload);
	return rc;
}

int deleteThing(struct mosquitto *mosq, const struct mosquitto_message *message)
{
	LOG_INFO("Clearing config file.....");
	core->ClearConfig();
	std::exit(42);
	return 0;
}
/**
* @brief handler to create a thing(gateway or end device) based on the MQTT message from growhouse server.
*
* @param mosq 
* @param message
*
* @return 
*/
int createThing(struct mosquitto *mosq, const struct mosquitto_message *message)
{


	int rc;
	document.Parse((char *) message->payload); // Parse the mqtt payload to JSON.
	for( rapidjson::SizeType i = 0; i < document.Size(); i++) 
	{
		if(document[i]["deviceType"] == DEVICE_TYPE_GATEWAY )
		{
			LOG_INFO("Create gateway thing call");
			// Call Create thing API for gateway
			auto response = core->CallCreateThingAPI((char *) message->payload);
			// Parse and store response for gateway type
			rc = core->ParseCreateGatewayResponse(response);	
		}
		else if(document[i]["deviceType"] == DEVICE_TYPE_SENSOR) 
		{
			LOG_INFO("Create sensor thing call");
			auto response = core->CallCreateThingAPI((char *) message->payload);
			rc = core->ParseCreateSensorResponse(response);	
			break;
		}
	}
	//auto response = core->CallCreateThingAPI((char *) message->payload);
	//auto rc = core->ParseAndUpdateConfig(response);	
	if(!rc) {
		if(!device) 
		{
			LOG_INFO("Initializing AWS MQTT connections");
			device = new AWSIoTDevice();
		}
	}
	else {
		LOG_INFO("Failed to parse the response...");
	}
	//LOG_INFO("Response: %s", response.c_str());
	/*Aws::String groupArn;
	Aws::String thingArn;

	for (rapidjson::SizeType i = 0; i < document.Size(); i++) {

	rapidjson::Value& data = document[i];

	if(document[i]["deviceType"] == DEVICE_TYPE_GATEWAY )
	{
		LOG_INFO("Device type is: %s", std::string(DEVICE_TYPE_GATEWAY).c_str() );
		std::string mac = document[i]["deviceUid"].GetString();
		std::string name = "group-" + std::string(DEVICE_TYPE_GATEWAY) + "-" + mac;
		groupName = name.c_str();
		auto response = core->CreateThingGroup(groupName);
	        if(response.IsSuccess())
        	{
	                LOG_INFO("Group thing with name: %s  successfully created", groupName.c_str());
			groupArn = response.GetResult().GetThingGroupArn();
			LOG_INFO("Group ARN: %s", groupArn.c_str());
			LOG_INFO("Attaching policy with group: %s ", groupName.c_str());
			core->UpdateConfigFile("groupArn", groupArn.c_str());
			core->UpdateConfigFile("groupName", groupName.c_str());
			auto result = core->AttachPolicy(groupArn);
			if(result.IsSuccess())
			{
				LOG_INFO("Attached policy: %s with group: %s ", POLICY_NAME, groupName.c_str());
			}				
			else
			{
				LOG_ERROR("Failed to attach policy: %s with group: %s", POLICY_NAME, groupName.c_str());
			}
	        }
	        else 
	        {
			std::cout << "Error: " << response.GetError().GetMessage() << std::endl;
			std::cout << "Exception: " << response.GetError().GetExceptionName() << std::endl;
			if(response.GetError().GetErrorType() == Aws::IoT::IoTErrors::RESOURCE_ALREADY_EXISTS)
			{
				LOG_ERROR("Group with name %s already exists", groupName.c_str());
			}
	                LOG_ERROR("Group thing with name: %s  failed to create.", groupName.c_str() );
	        }
		//name = std::string(DEVICE_TYPE_GATEWAY) + "-" + mac;
		//Aws::String thingName = name.c_str();
		name = std::string(document[i]["deviceType"].GetString()) + "-" + std::string(document[i]["deviceUid"].GetString());	
		Aws::String thingName = name.c_str();
		
                auto newThingResponse = core->CreateThing(thingName, data);

		if(newThingResponse.IsSuccess())
		{
			LOG_INFO("Thing with the name %s successfully created", thingName.c_str());
			LOG_INFO("Attaching the thing: %s with group: %s .....", thingName.c_str(), groupName.c_str());
			auto addThingToGroupResponse = core->AddThingToGroup(thingName, groupName);
			if(addThingToGroupResponse.IsSuccess())
			{
				LOG_INFO("Thing: %s attached successfully with group: %s ", thingName.c_str(), groupName.c_str());
			}
			else
			{
				std::cout << "Error attaching to group: " << addThingToGroupResponse.GetError().GetMessage() << std::endl;
			}
			LOG_INFO("Writing the thingName to config file.....");
			core->UpdateConfigFile("thingName", thingName.c_str());
			auto certificateArn = core->CreateKeysAndCertificate();
			if(certificateArn == "ERROR")
			{
				//TODO something here.	
			}
			else
			{
				LOG_INFO("Attaching the created certificates with the thing: %s", thingName.c_str());
				auto response = core->AttachThingPrincipal(certificateArn, thingName);
				if(response.IsSuccess())
				{	
					LOG_INFO("The certificate: %s successfully attached with the thing: %s", certificateArn.c_str(), thingName.c_str());
				}
				else
				{
					LOG_ERROR("Failed to attach certificate with the thing:%s ", thingName.c_str());
				}
			}
			LOG_INFO("Getting endpoint details....");
			auto response = core->DescribeEndpoint("iot:Data-ATS");
			if(response.IsSuccess())
			{
				LOG_INFO("Got endpoint details.....");
				LOG_INFO("Endpoint: %s", response.GetResult().GetEndpointAddress().c_str());
				core->UpdateConfigFile("endpoint", response.GetResult().GetEndpointAddress().c_str());
			}
			else
			{
				LOG_ERROR("Error getting endpoint details...");
				LOG_ERROR("Error: %s", response.GetError().GetMessage().c_str());
			}
			device = new AWSIoTDevice();
		}
		else
                {
			
			if(newThingResponse.GetError().GetErrorType() == Aws::IoT::IoTErrors::RESOURCE_ALREADY_EXISTS)
			{
				LOG_INFO("Thing: %s already exists", thingName.c_str());
				LOG_INFO("Updating the thing: %s", thingName.c_str());
				auto response = core->UpdateThing(thingName, data);
				if(response.IsSuccess())
				{
					LOG_INFO("The thing: %s has been updated", thingName.c_str());
				}
				else	
				{
					LOG_ERROR("Error updating the thing: %s", thingName.c_str());
					LOG_ERROR("Error: %s", response.GetError().GetMessage().c_str());
				}
			}
			else
		                std::cout << "Error creating thing: " << newThingResponse.GetError().GetMessage() << std::endl;
                }
	
			

	}
	else
	{
		if(groupName.empty())
		{
			LOG_INFO("Reading from config file......");
			groupName = core->ReadConfigFile("groupName");
			LOG_INFO("GroupName: %s", groupName.c_str());
		}
		LOG_INFO("Received request to create thing of type 'endDevice'");
		std::string name = std::string(document[i]["deviceType"].GetString()) + "-" + std::string(document[i]["eui64"].GetString());
                LOG_INFO("Name: %s", name.c_str());
		Aws::String thingName = name.c_str();

                auto newThingResponse = core->CreateThing(thingName, data);

                if(newThingResponse.IsSuccess())
                {
                        LOG_INFO("Thing with the name %s successfully created", thingName.c_str());
                        LOG_INFO("Attaching the thing: %s with group: %s .....", thingName.c_str(), groupName.c_str());
                        auto addThingToGroupResponse = core->AddThingToGroup(thingName, groupName);
                        if(addThingToGroupResponse.IsSuccess())
                        {
                                LOG_INFO("Thing: %s attached successfully with group: %s ", thingName.c_str(), groupName.c_str());
                        }
                        else
                        {
                                std::cout << "Error attaching to group: " << addThingToGroupResponse.GetError().GetMessage() << std::endl;
                        }

                }
                else
                {
                        if(newThingResponse.GetError().GetErrorType() == Aws::IoT::IoTErrors::RESOURCE_ALREADY_EXISTS)
                        {
                                LOG_INFO("Thing: %s already exists", thingName.c_str());
                                LOG_INFO("Updating the thing: %s", thingName.c_str());
                                auto response = core->UpdateThing(thingName, data);
                                if(response.IsSuccess())
                                {
                                        LOG_INFO("The thing: %s has been updated", thingName.c_str());
                                }
                                else
                                {
                                        LOG_ERROR("Error updating the thing: %s", thingName.c_str());
                                        LOG_ERROR("Error: %s", response.GetError().GetMessage().c_str());
                                }
                        }
                        else
                                std::cout << "Error creating thing: " << newThingResponse.GetError().GetMessage() << std::endl;
                }
				
		core->UpdateEndDeviceConfig(thingName.c_str(), data);	
	}
	}
		//core->UpdateEndDeviceConfig(thingName.c_str(), (char *)message->payload);	

	*/
	return 0;
}
/*enum mqtt_topic {

        MQTT_TYPE_MIN,
        MQTT_TYPE_CREATE_THING = MQTT_TYPE_MIN,
        MQTT_TYPE_MAX

};

const char * mqtt_topic_subscribe [] = {

        [MQTT_TYPE_CREATE_THING] = MQTT_SUB_CREATE_THING
};

typedef struct mosquitto_message_handler {

        int * mosquitto_topic;
        int (* handler)(struct mosquitto *, const struct mosquitto_message*);

}MOSQUITTO_MSG_HANDLER;

static const MOSQUITTO_MSG_HANDLER mosquitto_message_handler_array[] = {

        { .mosquitto_topic = (int *) MQTT_SUB_CREATE_THING,
                .handler = &createThing }

};*/



int main(int argc, char** argv)
{

	char clientid[24];
	int rc = 0;
	//Aws::Client::ClientConfiguration config;
	//config.region = Aws::Region::US_EAST_2;
	

	//AWSIoTCore core(config);
	//core = new AWSIoTCore(config);
	core = new AWSIoTCore();
	
	//device = new AWSIoTDevice();
	
	// Create default Policy
	//core->CheckPolicies();
	//core->CheckThingTypes();	
	//core->UpdateConfigFile("new_key", "testValue");
	
	LOG_INFO("It is working");
	auto cert = core->ReadConfigFile("certificatePath");
	if(cert != "")
	{
		LOG_INFO("AWS certificates are present...");
		LOG_INFO("Initializing AWS MQTT Connections...");
		device = new AWSIoTDevice();
		
	} 

	mosquitto_lib_init();
	memset(clientid, 0, 24);
        snprintf(clientid, 23, "AWSApp_1234" );

	mosq = mosquitto_new(clientid, true, 0);
        if(!mosq){
                mosquitto_lib_cleanup();
                LOG_ERROR("failed to start mosquitto\n");
                return -1;
        }
	if(mosq){

                mosquitto_connect_callback_set(mosq, connect_callback);
                mosquitto_message_callback_set(mosq, message_callback);

                if (mosquitto_connect(mosq, mqtt_host, mqtt_port, MOSQUITTO_PING_TIMEOUT)){
                        mosquitto_lib_cleanup();
                        LOG_ERROR("Unable to connect Mosquitto.\n");
                        return 1;
                }

                /*TODO : Add support for gracefully shoutdown appllication*/
                while(1){
                        rc = mosquitto_loop(mosq, -1, 1);
                        if(rc){
                                LOG_ERROR("connection error!\n");
                                std::this_thread::sleep_for(std::chrono::milliseconds(10000)); // 10s sleep
                                mosquitto_reconnect(mosq);
                        }
                }
                mosquitto_disconnect(mosq);
                mosquitto_destroy(mosq);
        }

        mosquitto_lib_cleanup();


	/*auto list = core->ListThings();
	if(list.IsSuccess())
	{
		std::cout << "Request Success" << std::endl;
	}
	else 
	{
		std::cout << "Some Error " << std::endl;
	}

	//Aws::String groupName = "my-group-1";
	Aws::String groupName;
	std::cout << "Enter Group Name: " << std::endl;
	std::cin >> groupName;

	auto response = core->CreateThingGroup(groupName);
	if(response.IsSuccess())
	{
		std::cout << "Group thing with name: " << groupName << " successfully created" << std::endl;
	}
	else 
	{
		std::cout << "Could Not create thing group" << std::endl;
	}*/

	/*Aws::SDKOptions options;
	options.loggingOptions.logLevel = Aws::Utils::Logging::LogLevel::Debug;
	Aws::InitAPI(options);
	{
		// make your SDK calls here.
		Aws::Client::ClientConfiguration config;
		config.region = Aws::Region::US_EAST_2;
		
		const Aws::IoT::Model::ListThingsRequest things;
		Aws::IoT::IoTClient client(config);
		const Aws::IoT::Model::ListThingsOutcome& list = client.ListThings(things);
		//auto list = client.ListThings(things);
		if(list.IsSuccess()){	
			//std::cout << list.GetResult() << std::endl;
			std::cout << "Request Success" << std::endl;
			auto payload = list.GetResult();
			
			//result = list.GetResult();
			std::cout << payload.GetThings().size() << std::endl;
			for(auto &thing : payload.GetThings()) {	
				//std::cout << "in loop" << std::endl;
				std::cout << thing.GetThingName() << std::endl;
			}
		}
		else {
			std::cout << list.GetError() << std::endl;
		}*/


	/*	Aws::IoT::Model::CreateThingRequest newThing;
		Aws::String name = "from-cpp";
		newThing.SetThingName(name);
		Aws::IoT::Model::CreateThingOutcome response = client.CreateThing(newThing);
		if(response.IsSuccess()) 
		{
			std::cout <<"New Thing Created" << std::endl;
			std::cout << response.GetResult().GetThingArn() << std::endl;
		} */
		/*for (auto const &s : list.end())
		{
     			std::cout << s << std::endl;
		}*/
	//}
	//Aws::ShutdownAPI(options);
	return 0;
}
