#include "aws-iot-device-class.hpp"

awsiotsdk::ResponseCode AWSIoTDevice::ReconnectCallback(awsiotsdk::util::String client_id,
                                               std::shared_ptr<awsiotsdk::ReconnectCallbackContextData> p_app_handler_data,
                                               awsiotsdk::ResponseCode reconnect_result)
{
        LOG_INFO("Client: %s Reconnect Attempted! ", client_id.c_str());
        LOG_INFO(" Response: %s", awsiotsdk::ResponseHelper::ToString(reconnect_result).c_str());
        return awsiotsdk::ResponseCode::SUCCESS;
}

AWSIoTDevice::AWSIoTDevice()
{
	LOG_INFO("Constructor called");

	if(AWS_SDK_DEBUG)
	{
		std::shared_ptr<awsiotsdk::util::Logging::ConsoleLogSystem> p_log_system =
        	        std::make_shared<awsiotsdk::util::Logging::ConsoleLogSystem>(awsiotsdk::util::Logging::LogLevel::Debug);
	        awsiotsdk::util::Logging::InitializeAWSLogging(p_log_system);
	}

	awsiotsdk::ResponseCode configResponse = awsiotsdk::ConfigCommon::InitializeCommon(CONFIG_FILE);
        if (awsiotsdk::ResponseCode::SUCCESS == configResponse) {
                LOG_INFO("Config file loaded successfully");
        }
	else
	{
        	LOG_ERROR("Error Response: %s", awsiotsdk::ResponseHelper::ToString(configResponse).c_str());
	}
	LOG_INFO("root_ca_path: %s",awsiotsdk::ConfigCommon::root_ca_path_.c_str());
	p_network_connection =
                std::make_shared<awsiotsdk::network::OpenSSLConnection>(awsiotsdk::ConfigCommon::endpoint_,
                                                             awsiotsdk::ConfigCommon::endpoint_mqtt_port_,
                                                             awsiotsdk::ConfigCommon::root_ca_path_,
                                                             awsiotsdk::ConfigCommon::client_cert_path_,
                                                             awsiotsdk::ConfigCommon::client_key_path_,
                                                             awsiotsdk::ConfigCommon::tls_handshake_timeout_,
                                                             awsiotsdk::ConfigCommon::tls_read_timeout_,
                                                             awsiotsdk::ConfigCommon::tls_write_timeout_, true);
	awsiotsdk::ResponseCode rc = p_network_connection->Initialize();
        if(awsiotsdk::ResponseCode::SUCCESS == rc) {
                LOG_INFO("Network Connection Initialized");
        }
	
	awsiotsdk::ClientCoreState::ApplicationReconnectCallbackPtr p_reconnect_handler =
                std::bind(&AWSIoTDevice::ReconnectCallback,
                          this,
                          std::placeholders::_1,
                          std::placeholders::_2,
                          std::placeholders::_3);


        p_iot_client_ = awsiotsdk::MqttClient::Create(p_network_connection,
                                                awsiotsdk::ConfigCommon::mqtt_command_timeout_,
                                                nullptr, nullptr,
                                                p_reconnect_handler, nullptr,
                                                nullptr, nullptr);

	//p_iot_client_ = awsiotsdk::MqttClient::Create(p_network_connection, awsiotsdk::ConfigCommon::mqtt_command_timeout_);


	awsiotsdk::util::String clientIdTagged = CLIENT_ID_PREFIX;
        clientIdTagged.append(std::to_string(rand()));
        std::unique_ptr<awsiotsdk::Utf8String> clientId = awsiotsdk::Utf8String::Create(clientIdTagged);
	
        LOG_INFO("Setting auto reconnect for the client....");
        p_iot_client_->SetAutoReconnectEnabled(true);


	LOG_INFO("Trying MQTT Connect");
	int count = 1;
        do {
                LOG_INFO("Trying now...count: %d", count);
                rc = p_iot_client_->Connect(std::chrono::milliseconds(30000), false, awsiotsdk::mqtt::Version::MQTT_3_1_1, std::chrono::seconds(60), std::move(clientId), nullptr, nullptr, nullptr);

                if(awsiotsdk::ResponseCode::MQTT_CONNACK_CONNECTION_ACCEPTED == rc) {
                        LOG_INFO("MQTT Connection established!");
                	LOG_INFO("Response: %s", awsiotsdk::ResponseHelper::ToString(rc).c_str());
                }
                else {
                	LOG_INFO("Response: %s", awsiotsdk::ResponseHelper::ToString(rc).c_str());
                }
                count++;
	} while(count <= MAX_RETRY_COUNT || (awsiotsdk::ResponseCode::MQTT_CONNACK_CONNECTION_ACCEPTED == rc));	
}

int AWSIoTDevice::Publish(const char * topic, const char * payload)
{
	awsiotsdk::util::String p_pub_topic_name_str = topic;
        std::unique_ptr<awsiotsdk::Utf8String> p_pub_topic_name = awsiotsdk::Utf8String::Create(p_pub_topic_name_str);
        awsiotsdk::util::String payloadData = payload;
        awsiotsdk::ResponseCode rc = p_iot_client_->Publish(std::move(p_pub_topic_name), false, false, awsiotsdk::mqtt::QoS::QOS1, payloadData, std::chrono::milliseconds(30000));
	if(rc == awsiotsdk::ResponseCode::SUCCESS)
	{
		LOG_INFO("Message successfully published on topic: %s", topic);
		return 0;
	}
	return -1;
}

/**
* @brief Destructor for the AWSIoTDevice class.
*/
AWSIoTDevice::~AWSIoTDevice()
{
	if(AWS_SDK_DEBUG)
		awsiotsdk::util::Logging::ShutdownAWSLogging();
}
